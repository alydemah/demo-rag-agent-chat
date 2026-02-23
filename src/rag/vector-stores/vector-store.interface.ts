import type { Document } from '@langchain/core/documents';

export interface IVectorStoreService {
  initialize(): Promise<void>;
  addDocuments(documents: Document[]): Promise<void>;
  similaritySearch(query: string, k: number): Promise<Document[]>;
  getDocumentCount(): number;
}

export const VECTOR_STORE = Symbol('VECTOR_STORE');
