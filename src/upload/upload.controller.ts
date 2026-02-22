import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service.js';

@Controller('api/upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(
      `uploadFile() - Received file upload: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );
    if (!file) {
      this.logger.warn('uploadFile() - No file provided in the request');
      throw new BadRequestException('No file provided');
    }

    // Allowed file types: PDF, Markdown, Text
    // TODO add more types
    const allowedExts = ['.pdf', '.md', '.txt'];
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExts.includes(`.${ext}`)) {
      this.logger.warn(
        `uploadFile() - Unsupported file type: .${ext}. Allowed types: ${allowedExts.join(', ')}`,
      );

      throw new BadRequestException(
        `Unsupported file type. Allowed: ${allowedExts.join(', ')}`,
      );
    }

    return this.uploadService.handleUpload(file);
  }
}
