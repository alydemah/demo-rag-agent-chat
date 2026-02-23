import type { ILLMProvider } from './llm-provider.interface.js';
import { OpenAILLMProvider } from './openai-llm.provider.js';
import { AnthropicLLMProvider } from './anthropic-llm.provider.js';

export function createLlmProvider(provider: string, apiKey: string, model: string): ILLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAILLMProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicLLMProvider(apiKey, model);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}
