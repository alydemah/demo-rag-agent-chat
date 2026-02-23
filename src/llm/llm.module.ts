import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, EMBEDDING_PROVIDER } from './providers/llm-provider.interface.js';
import { createLlmProvider } from './providers/llm-provider.factory.js';
import { createEmbeddingProvider } from './embeddings/embedding-provider.factory.js';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('app.llm.provider')!;
        const apiKey = configService.get<string>('app.llm.apiKey')!;
        const model = configService.get<string>('app.llm.model')!;
        return createLlmProvider(provider, apiKey, model);
      },
      inject: [ConfigService],
    },
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: async (configService: ConfigService) => {
        const provider = configService.get<string>('app.embedding.provider')!;
        const model = configService.get<string>('app.embedding.model')!;
        const cachePath = configService.get<string>('app.embedding.cachePath')!;
        const apiKey = configService.get<string>('app.embedding.apiKey');
        const llmApiKey = configService.get<string>('app.llm.apiKey');
        

        // We pass both embedding-specific API key and LLM API key to the factory. The factory will decide which one to use based on the provider type.
        return createEmbeddingProvider(provider, model, cachePath, apiKey, llmApiKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LLM_PROVIDER, EMBEDDING_PROVIDER],
})
export class LlmModule {}
