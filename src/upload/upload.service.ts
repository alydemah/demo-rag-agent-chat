import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { IngestionService } from '../rag/ingestion.service.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly ingestionService: IngestionService) {}

  async handleUpload(file: Express.Multer.File): Promise<{ filename: string; chunks: number }> {
    this.logger.log(`handleUpload() - Received file: ${file.originalname}, size: ${file.size} bytes`);

    const uploadDir = './storage/uploads';

    await fs.mkdir(uploadDir, { recursive: true });
    const savedPath = path.join(uploadDir, file.originalname);

    await fs.writeFile(savedPath, file.buffer);
    this.logger.log(`File saved: ${savedPath}`);

    const result = await this.ingestionService.ingestFile(savedPath);

    this.logger.log(`File ingested: ${file.originalname}, chunks created: ${result.chunks}`);

    
    return { filename: file.originalname, chunks: result.chunks };
  }
}
