import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module.js';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

@Module({
  imports: [RagModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
