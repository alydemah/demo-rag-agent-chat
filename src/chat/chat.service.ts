import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import {
  AgentExecutor,
  createToolCallingAgent,
} from '@langchain/classic/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  LLM_PROVIDER,
  type ILLMProvider,
} from '../llm/providers/llm-provider.interface.js';
import { MockApiService } from '../services/mock-api.service.js';
import { RetrieverService } from '../rag/retriever.service.js';
import { SessionService } from './session.service.js';
import type { ChatResponseDto } from './dto/chat-response.dto.js';

const buildSystemPrompt = (context: string): string => {
  return `
    You are an AI HR assistant for a company. Answer employee questions using the provided context and available tools.

    Context from company documents:
    ${context || 'No relevant documents found.'}

    Guidelines:
    - Use the context above to answer policy and document-related questions.
    - Use the available tools for employee-specific data (vacation balance, salary info, schedule, directory search).
    - If you don't have enough information, say so clearly.
    - Be helpful, professional, and concise.
    `;
};

/**
 * ChatService is responsible for handling chat interactions. It retrieves relevant document chunks based on the user's query,
 * interacts with the LLM provider, and utilizes various tools to provide comprehensive responses.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly tools: DynamicStructuredTool[];

  constructor(
    @Inject(LLM_PROVIDER) private readonly llmProvider: ILLMProvider,
    private readonly api: MockApiService,
    private readonly retrieverService: RetrieverService,
    private readonly sessionService: SessionService,
  ) {
    this.tools = [
      new DynamicStructuredTool({
        name: 'get_vacation_balance',
        description:
          'Get remaining vacation/PTO days for an employee. Requires an employee ID.',
        schema: z.object({
          employeeId: z.string().describe('Employee ID, e.g. EMP001'),
        }),
        func: async (input) => {
          const balance = await this.api.getVacationBalance(input.employeeId);
          return `${balance.name} has ${balance.remainingDays} vacation days remaining out of ${balance.totalDays} total. ${balance.usedDays} used, ${balance.pendingRequests} pending requests.`;
        },
      }),

      new DynamicStructuredTool({
        name: 'get_salary_info',
        description:
          'Get salary and compensation details for an employee. Requires an employee ID.',
        schema: z.object({
          employeeId: z.string().describe('Employee ID, e.g. EMP001'),
        }),
        func: async (input) => {
          const info = await this.api.getSalaryInfo(input.employeeId);
          return `${info.name}: $${info.baseSalary.toLocaleString()} ${info.currency}, paid ${info.payFrequency}. Last raise: ${info.lastRaiseDate}.`;
        },
      }),

      new DynamicStructuredTool({
        name: 'search_directory',
        description: 'Search the employee directory by name or department.',
        schema: z.object({
          query: z.string().describe('Search query (name or keyword)'),
          department: z.string().optional().describe('Filter by department'),
        }),
        func: async (input) => {
          const employees = await this.api.searchDirectory(
            input.query,
            input.department,
          );
          if (employees.length === 0)
            return 'No employees found matching the query.';
          return employees
            .map((e) => `${e.name} — ${e.title}, ${e.department} (${e.email})`)
            .join('\n');
        },
      }),

      new DynamicStructuredTool({
        name: 'get_schedule',
        description: 'Get work schedule and upcoming meetings for an employee.',
        schema: z.object({
          employeeId: z.string().describe('Employee ID, e.g. EMP001'),
          date: z
            .string()
            .optional()
            .describe('Date in YYYY-MM-DD format, defaults to today'),
        }),
        func: async (input) => {
          const entries = await this.api.getSchedule(
            input.employeeId,
            input.date,
          );
          if (entries.length === 0) return 'No schedule entries found.';
          return entries
            .map(
              (e) =>
                `${e.startTime}-${e.endTime}: ${e.title} (${e.location}) [${e.type}]`,
            )
            .join('\n');
        },
      }),
    ];
  }

  /*
   * Main method to handle chat interactions. It retrieves relevant documents, constructs a prompt, creates an agent, and executes it to get a response.
   * It also handles errors gracefully, especially those related to LLM API key configuration.
   * Returns a structured response including the answer, session ID, sources used, tools invoked, and a timestamp.
   *
   */
  async chat(message: string, sessionId?: string): Promise<ChatResponseDto> {
    this.logger.log(
      `Chat request: "${message}" (session: ${sessionId || 'new'})`,
    );

    const session = this.sessionService.getOrCreateSession(sessionId);

    // 1. Retrieve relevant document chunks
    const relevantDocs = await this.retrieverService.retrieve(message);
    const context = relevantDocs
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join('\n\n');
    const sources = [
      ...new Set(
        relevantDocs
          .map((doc) => doc.metadata?.source as string)
          .filter(Boolean),
      ),
    ];

    this.logger.log(
      `Retrieved ${relevantDocs.length} chunks from ${sources.length} sources`,
    );

    // 2. Build prompt with context embedded directly
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', buildSystemPrompt(context)],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // 3. Create agent
    const chatModel = this.llmProvider.createChatModel();

    const agent = createToolCallingAgent({
      llm: chatModel,
      tools: this.tools,
      prompt,
    });

    ////////////
    // 4. Execute
    const executor = new AgentExecutor({
      agent,
      tools: this.tools,
      memory: session.memory,
      returnIntermediateSteps: true,
    });

    let answer: string;
    let toolsUsed: string[] = [];

    try {
      const result = await executor.invoke({ input: message });
      this.logger.log(`Agent execution completed successfully.`);

      answer = result.output as string;
      this.logger.log(`Agent answer: ${answer}`);
      toolsUsed = (result.intermediateSteps || [])
        .map((step: any) => step.action?.tool as string)
        .filter(Boolean);
      this.logger.log(`Tools used in this interaction: ${toolsUsed.join(', ')}`);
      
    } catch (err: any) {
      this.logger.error(`Agent execution failed: ${err.message}`);

      if (
        err.lc_error_code === 'MODEL_AUTHENTICATION' ||
        err.message?.includes('API key')
      ) {
        answer =
          'LLM API key is not configured. Please set a valid LLM_API_KEY in your .env file.';
      } else {
        answer =
          'Sorry, I encountered an error processing your request. Please try again.';
      }
    }

    return {
      answer,
      sessionId: session.sessionId,
      sources,
      toolsUsed,
      timestamp: new Date().toISOString(),
    };
  }
}
