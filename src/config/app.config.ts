import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  },
  embedding: {
    provider: process.env.EMBEDDING_PROVIDER || 'local',
    model: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    apiKey: process.env.EMBEDDING_API_KEY || undefined,
    cachePath: process.env.EMBEDDING_CACHE_PATH || './storage/models',
  },
  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200', 10),
    topK: parseInt(process.env.RAG_TOP_K || '4', 10),
    documentsPath: process.env.RAG_DOCUMENTS_PATH || './documents',
  },
  vectorStore: {
    type: process.env.VECTOR_STORE || 'memory',
    persistPath: process.env.VECTOR_STORE_PERSIST_PATH || './vector-data',
  },
  hrApi: {
    mode: process.env.HR_API_MODE || 'mock',
    baseUrl: process.env.HR_API_BASE_URL || undefined,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
}));
