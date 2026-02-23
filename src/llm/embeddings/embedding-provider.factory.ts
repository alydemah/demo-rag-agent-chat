import { Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { Embeddings } from '@langchain/core/embeddings';

const logger = new Logger('EmbeddingProviderFactory');
// Factory function to create embedding provider instances based on configuration
export async function createEmbeddingProvider(
  provider: string,
  model: string,
  cachePath: string,
  apiKey?: string,
  llmApiKey?: string,
): Promise<Embeddings> {
  switch (provider) {
    
    case 'local': {

      const resolvedCache = path.resolve(cachePath);
      fs.mkdirSync(resolvedCache, { recursive: true });

      const { env } = await import('@huggingface/transformers');
      env.cacheDir = resolvedCache;

      const { HuggingFaceTransformersEmbeddings } = await import(
        '@langchain/community/embeddings/huggingface_transformers'
      );
      logger.log(`Using local embeddings with model: ${model} (cache: ${resolvedCache})`);

      return new HuggingFaceTransformersEmbeddings({
        model,
      }) as unknown as Embeddings;

    }
    case 'openai': {
      
      const { OpenAIEmbeddings } = await import('@langchain/openai');
      const key = apiKey || llmApiKey;

      logger.log(`Using OpenAI embeddings with model: ${model}`);

      return new OpenAIEmbeddings({
        model,
        apiKey: key,
      }) as unknown as Embeddings;
    }
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}
