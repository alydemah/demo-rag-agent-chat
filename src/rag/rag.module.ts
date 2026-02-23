import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Embeddings } from '@langchain/core/embeddings';
import { VECTOR_STORE } from './vector-stores/vector-store.interface.js';
import { createVectorStore } from './vector-stores/vector-store.factory.js';
import { IngestionService } from './ingestion.service.js';
import { RetrieverService } from './retriever.service.js';
import { RagService } from './rag.service.js';
import { LoaderFactoryService } from './loaders/loader-factory.service.js';
import { EMBEDDING_PROVIDER } from '../llm/providers/llm-provider.interface.js';

@Module({
  providers: [
    {
      provide: VECTOR_STORE,
      useFactory: async (configService: ConfigService, embeddings: Embeddings) => {

        const type = configService.get<string>('app.vectorStore.type')!;
        console.log(`Initializing vector store of type: ${type}`); // Debug log
        const persistPath = configService.get<string>('app.vectorStore.persistPath')!;

        // We create the vector store instance and call initialize() to load existing data if available
        const store = createVectorStore(type, persistPath, embeddings);
        await store.initialize();
        return store;
      },
      inject: [ConfigService, EMBEDDING_PROVIDER],
    },
    LoaderFactoryService,
    IngestionService,
    RetrieverService,
    RagService,
  ],
  exports: [IngestionService, RetrieverService, VECTOR_STORE],
})
export class RagModule {}
