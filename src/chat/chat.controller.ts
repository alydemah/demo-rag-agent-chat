import { Body, Controller, Get, Logger, Post, Query, UsePipes } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { SessionService } from './session.service.js';
import { RetrieverService } from '../rag/retriever.service.js';
import { ChatMessageSchema, type ChatMessageDto } from './dto/chat-message.dto.js';
import type { ChatResponseDto } from './dto/chat-response.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly sessionService: SessionService,
    private readonly retrieverService: RetrieverService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ChatMessageSchema))
  async chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    this.logger.log(`chat() - Received chat message: "${dto.message}" with sessionId=${dto.sessionId}`);
    return this.chatService.chat(dto.message, dto.sessionId);
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('k') k?: string) {
    this.logger.log(`search() - Received search query: "${query}" with k=${k}`);

    const docs = await this.retrieverService.retrieve(query, k ? parseInt(k, 10) : undefined);
    
    return {
      query,
      results: docs.map((doc) => ({
        content: doc.pageContent.substring(0, 200) + '...',
        source: doc.metadata?.source,
      })),
      totalDocuments: this.retrieverService.getDocumentCount(),
    };
  }


}
