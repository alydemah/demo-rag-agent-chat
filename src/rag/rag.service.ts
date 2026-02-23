import { Injectable, Logger } from '@nestjs/common';
import type { Document } from '@langchain/core/documents';
import { RetrieverService } from './retriever.service.js';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly retrieverService: RetrieverService) {}

  async query(question: string, topK?: number): Promise<{ sources: Document[] }> {
    this.logger.log(`query() - Received query: "${question}" with topK=${topK}`);
    const sources = await this.retrieverService.retrieve(question, topK);
    return { sources };
  }
}
