import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface ILLMProvider {
  createChatModel(): BaseChatModel;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
