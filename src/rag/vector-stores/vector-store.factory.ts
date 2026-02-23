import type { Embeddings } from '@langchain/core/embeddings';
import type { IVectorStoreService } from './vector-store.interface.js';
import { MemoryVectorStoreService } from './memory-vector-store.service.js';
import { HnswlibVectorStoreService } from './hnswlib-vector-store.service.js';


// Factory function to create vector store instances based on configuration
export function createVectorStore(
  type: string,
  persistPath: string,
  embeddings: Embeddings,
): IVectorStoreService {
  switch (type) {
    case 'memory':
      return new MemoryVectorStoreService(embeddings);
    case 'hnswlib':
      return new HnswlibVectorStoreService(embeddings, persistPath);
    default:
      throw new Error(`Unknown vector store type: ${type}`);
  }
}
