import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import type { Document } from '@langchain/core/documents';
import type { Embeddings } from '@langchain/core/embeddings';
import type { IVectorStoreService } from './vector-store.interface.js';
import { Logger } from '@nestjs/common/services/index.js';
import * as fs from 'node:fs';

// TODO
export class HnswlibVectorStoreService implements IVectorStoreService {
  private readonly logger = new Logger(HnswlibVectorStoreService.name);
  private store!: HNSWLib;
  private documentCount = 0;

  constructor(
    private readonly embeddings: Embeddings,
    private readonly persistPath: string,
  ) {}

  async initialize(): Promise<void> {
    this.logger.log(`Initializing HNSWLibVectorStore with persistPath: ${this.persistPath}...`);
    
    const indexExists = fs.existsSync(`${this.persistPath}/hnswlib.index`);

    if (indexExists) {
      this.logger.log(`Loading existing HNSWLib index from ${this.persistPath}`);

      this.store = await HNSWLib.load(this.persistPath, this.embeddings);
      this.documentCount = this.store.docstore._docs.size;

      this.logger.log(`Loaded ${this.documentCount} documents from disk`);
    } else {
      this.logger.log(`No existing index found. Creating new HNSWLib store.`);
      this.store = await HNSWLib.fromDocuments([], this.embeddings);
      fs.mkdirSync(this.persistPath, { recursive: true });
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    this.logger.log(`addDocuments() - Adding ${documents.length} documents to HNSWLib...`);
   
    await this.store.addDocuments(documents);
    this.documentCount += documents.length;

    await this.store.save(this.persistPath);
    this.logger.log(`addDocuments() - Saved to disk. Total document count: ${this.documentCount}`);
  }

  async similaritySearch(query: string, k: number): Promise<Document[]> {
    if (this.documentCount === 0) return [];
    return this.store.similaritySearch(query, k);
  }

  getDocumentCount(): number {
    return this.documentCount;
  }
}
