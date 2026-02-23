import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import type { Document } from '@langchain/core/documents';

export class TextDocumentLoader {
  constructor(private readonly filePath: string) {}

  async load(): Promise<Document[]> {
    const loader = new TextLoader(this.filePath);
    const docs = await loader.load();
    return docs.map((doc) => ({
      ...doc,
      metadata: { ...doc.metadata, source: this.filePath, format: 'text' },
    }));
  }
}
