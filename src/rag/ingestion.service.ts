import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { VECTOR_STORE, type IVectorStoreService } from './vector-stores/vector-store.interface.js';
import { LoaderFactoryService } from './loaders/loader-factory.service.js';


/**
 * IngestionService is responsible for loading documents from the configured directory,
 * splitting them into chunks, and adding those chunks to the vector store.
*/
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(VECTOR_STORE) private readonly vectorStore: IVectorStoreService,
    private readonly loaderFactory: LoaderFactoryService,
    private readonly configService: ConfigService,
  ) {}

  async ingestAll(): Promise<{ totalChunks: number; files: string[] }> {
    this.logger.log('ingestAll() - Starting document ingestion...');

    const docsPath = this.configService.get<string>('app.rag.documentsPath')!;
    const chunkSize = this.configService.get<number>('app.rag.chunkSize')!;
    const chunkOverlap = this.configService.get<number>('app.rag.chunkOverlap')!;

    this.logger.debug(`Ingestion config - docsPath: ${docsPath}, chunkSize: ${chunkSize}, chunkOverlap: ${chunkOverlap}`);


    const supportedExts = this.loaderFactory.getSupportedExtensions();

    let entries: string[];
    try {
      entries = await fs.readdir(docsPath);
      this.logger.log(`Found ${entries.length} docs in documents directory`);
    } catch {
      this.logger.warn(`Documents directory not found: ${docsPath}`);
      return { totalChunks: 0, files: [] };
    }

    const files = entries.filter((f) =>
      supportedExts.includes(path.extname(f).toLowerCase()),
    );

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    let totalChunks = 0;
    for (const file of files) {

      const filePath = path.join(docsPath, file);
      this.logger.log(`Processing file: ${filePath}`);
      try {
        const loader = this.loaderFactory.getLoader(filePath);
        const docs = await loader.load();
        this.logger.log(`Loaded ${docs.length} documents from ${filePath}`);

        const chunks = await splitter.splitDocuments(docs);
        await this.vectorStore.addDocuments(chunks);
        totalChunks += chunks.length;
        this.logger.log(`Ingested ${file}: ${chunks.length} chunks`);
      } catch (err) {
        this.logger.error(`Failed to ingest ${file}: ${err}`);
      }
    }

    this.logger.log(`Ingestion complete: ${totalChunks} chunks from ${files.length} files`);
    return { totalChunks, files };
  }

  async ingestFile(filePath: string): Promise<{ chunks: number }> {
    this.logger.log(`ingestFile() - Ingesting file: ${filePath}`);

    const chunkSize = this.configService.get<number>('app.rag.chunkSize')!;
    const chunkOverlap = this.configService.get<number>('app.rag.chunkOverlap')!;
    this.logger.debug(`Ingestion config - chunkSize: ${chunkSize}, chunkOverlap: ${chunkOverlap}`);

    const loader = this.loaderFactory.getLoader(filePath);
    const docs = await loader.load();
    this.logger.log(`ingestFile() - Loaded ${docs.length} documents from ${filePath}`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    const chunks = await splitter.splitDocuments(docs);
    await this.vectorStore.addDocuments(chunks);
    return { chunks: chunks.length };
  }
}
