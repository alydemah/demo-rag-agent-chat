# HR Chatbot

AI-powered HR assistant that answers questions from documents (RAG) and fetches live employee data via tool calling.

Built with NestJS, LangChain.js, and OpenAI.

## Prerequisites

- Node.js 20+
- An OpenAI API key (or Anthropic)

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd tasknestjs
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your API key:
#   LLM_API_KEY=sk-your-key-here

# Add documents to ingest
# Place PDF, MD, or TXT files in ./storage/documents/

# Start the server
npm run start:dev
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send a message `{ "message": "...", "sessionId?": "..." }` |
| `GET` | `/api/chat/search?q=&k=` | Search documents directly |
| `POST` | `/api/upload` | Upload a document (PDF, MD, TXT) |

## Configuration

Key settings in `.env`:

| Variable | Default | Options |
|----------|---------|---------|
| `LLM_PROVIDER` | `openai` | `openai`, `anthropic` |
| `EMBEDDING_PROVIDER` | `local` | `local` (free, no API key), `openai` |
| `VECTOR_STORE` | `memory` | `memory` (RAM, re-ingests on restart), `hnswlib` (persists to disk) |
| `RAG_CHUNK_SIZE` | `1000` | Characters per chunk |
| `RAG_TOP_K` | `4` | Number of chunks to retrieve |

## Project Structure

```
src/
  main.ts                  # Bootstrap + document ingestion on startup
  app.module.ts            # Root module
  config/                  # Environment config + prompts
  llm/
    providers/             # LLM chat providers (OpenAI, Anthropic)
    embeddings/            # Embedding providers (local HuggingFace, OpenAI)
  chat/
    chat.controller.ts     # REST endpoints
    chat.service.ts        # Agent orchestration (RAG + tools)
    session.service.ts     # In-memory conversation history
    dto/                   # Zod request/response schemas
  rag/
    loaders/               # Document loaders (PDF, MD, TXT)
    vector-stores/         # Vector store implementations (Memory, HNSWLib)
    ingestion.service.ts   # Load -> chunk -> embed -> store
    retriever.service.ts   # Query vector store for relevant chunks
  services/
    mock-api.service.ts    # Fake HR data (vacation, salary, directory, schedule)
  upload/                  # File upload -> ingestion
public/                    # Static HTML chat UI
```

See [design.md](./design.md) for architecture details, trade-offs, and assumptions.
