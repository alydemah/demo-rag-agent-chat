import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ILLMProvider } from './llm-provider.interface.js';

export class OpenAILLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  createChatModel(): BaseChatModel {
    return new ChatOpenAI({
      model: this.model,
      apiKey: this.apiKey,
    });
  }
}
