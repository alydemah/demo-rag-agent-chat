import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import type { Document } from '@langchain/core/documents';
import type { Embeddings } from '@langchain/core/embeddings';
import type { IVectorStoreService } from './vector-store.interface.js';
import { Logger } from '@nestjs/common/services/index.js';

export class MemoryVectorStoreService implements IVectorStoreService {
  private readonly logger = new Logger(MemoryVectorStoreService.name);

  private store!: MemoryVectorStore;
  private documentCount = 0;

  constructor(private readonly embeddings: Embeddings) {}

  async initialize(): Promise<void> {
    this.logger.log(`Initializing MemoryVectorStore...`);
    this.store = new MemoryVectorStore(this.embeddings);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    this.logger.log(
      `addDocuments() - Adding ${documents.length} documents to MemoryVectorStore...`,
    );
    await this.store.addDocuments(documents);
    this.documentCount += documents.length;

    this.logger.log(
      `addDocuments() - Successfully added documents. Total document count: ${this.documentCount}`,
    );
  }

  async similaritySearch(query: string, k: number): Promise<Document[]> {
    return this.store.similaritySearch(query, k);
  }

  getDocumentCount(): number {
    return this.documentCount;
  }
}
