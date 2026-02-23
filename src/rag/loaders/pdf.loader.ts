import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import type { Document } from '@langchain/core/documents';

export class PdfDocumentLoader {
  constructor(private readonly filePath: string) {}

  async load(): Promise<Document[]> {
    const loader = new PDFLoader(this.filePath);
    const docs = await loader.load();
    return docs.map((doc) => ({
      ...doc,
      metadata: { ...doc.metadata, source: this.filePath, format: 'pdf' },
    }));
  }
}
