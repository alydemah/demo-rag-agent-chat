import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ILLMProvider } from './llm-provider.interface.js';

export class AnthropicLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  createChatModel(): BaseChatModel {
    return new ChatAnthropic({
      model: this.model,
      apiKey: this.apiKey,
    }) as unknown as BaseChatModel;
  }
}
