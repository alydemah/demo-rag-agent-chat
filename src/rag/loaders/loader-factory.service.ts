import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { PdfDocumentLoader } from './pdf.loader.js';
import { MarkdownDocumentLoader } from './markdown.loader.js';
import { TextDocumentLoader } from './text.loader.js';

export type DocumentLoader = { load(): Promise<import('@langchain/core/documents').Document[]> };

@Injectable()
export class LoaderFactoryService {
  
  getLoader(filePath: string): DocumentLoader {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return new PdfDocumentLoader(filePath);
      case '.md':
        return new MarkdownDocumentLoader(filePath);
      case '.txt':
        return new TextDocumentLoader(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  getSupportedExtensions(): string[] {
    return ['.pdf', '.md', '.txt'];
  }
}
