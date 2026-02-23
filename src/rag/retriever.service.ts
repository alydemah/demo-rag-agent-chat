import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Document } from '@langchain/core/documents';
import { VECTOR_STORE, type IVectorStoreService } from './vector-stores/vector-store.interface.js';

/**
 * RetrieverService is responsible for retrieving relevant document chunks from the vector store
 * based on a user query. It uses similarity search to find the most relevant chunks.
*/
@Injectable()
export class RetrieverService {
  private readonly logger = new Logger(RetrieverService.name);
  constructor(
    @Inject(VECTOR_STORE) private readonly vectorStore: IVectorStoreService,
    private readonly configService: ConfigService,
  ) {}

  async retrieve(query: string, topK?: number): Promise<Document[]> {
    this.logger.log(`retrieve() - Received query: "${query}" with topK=${topK}`);
    
    const k = topK ?? this.configService.get<number>('app.rag.topK')!;
    return this.vectorStore.similaritySearch(query, k);
  }

  getDocumentCount(): number {
    const count = this.vectorStore.getDocumentCount();
    this.logger.log(`getDocumentCount() - Current document count: ${count}`);
    return count;
  }
}
