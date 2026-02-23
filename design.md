# Design - DMEO HR Chatbot

## What This Project Is

An AI-powered HR assistant chatbot built with NestJS that does two things:

1. **Answers questions from documents** (PDF, Markdown, TXT) using RAG (Retrieval-Augmented Generation)
2. **Fetches live employee data** (vacation days, salary, schedule) using LLM tool calling

The user talks to the chatbot through a web UI or REST API. The LLM decides whether to answer from documents, call a tool, or both.

---

## How It Works

```
User sends message
       |
       v
POST /api/chat  -->  ChatController  -->  ChatService
                                              |
                          +-------------------+-------------------+
                          |                                       |
                    RetrieverService                        LLM Agent
                    (searches vector store                 (GPT-4o-mini / Claude)
                     for relevant chunks)                        |
                          |                           decides what to do:
                          v                                      |
                    Top-K document chunks            +-----------+-----------+
                    injected into prompt             |           |           |
                                              answer from   call a tool   both
                                              documents     (HR API)
                                                                |
                                                          MockApiService
                                                          (fake employee data)
```

### Step by Step

1. User sends a chat message with an optional session ID
2. `ChatService` retrieves relevant document chunks via `RetrieverService` -> vector store similarity search
3. Retrieved chunks are injected into the system prompt as context
4. A LangChain `AgentExecutor` is created with the LLM, tools, prompt, and conversation memory
5. The LLM processes the message and decides: answer from context, call a tool, or both
6. If a tool is called (e.g., `get_vacation_balance`), it hits `MockApiService` which returns fake employee data
7. The response is returned with the answer, source documents, and which tools were used

---

## Module Architecture

```
AppModule (root)
  |
  +-- ConfigModule         .env -> typed config object
  +-- ServeStaticModule    serves public/ folder (HTML chat UI)
  +-- LlmModule (global)   provides LLM + Embedding instances via DI
  |
  +-- ChatModule           chat controller, service, sessions
  |     uses: RagModule, ServicesModule
  |
  +-- RagModule            document ingestion, vector store, retrieval
  |     uses: LlmModule (embeddings)
  |
  +-- ServicesModule       mock HR API with fake employee data
  |
  +-- UploadModule         file upload endpoint -> triggers ingestion
        uses: RagModule
```

Each module owns one responsibility. They communicate through NestJS dependency injection.

---

## Key Design Decisions

### 1. LLM Handles Routing

There is no hardcoded intent classifier or keyword matcher. The LangChain agent sees tool descriptions and document context, then naturally decides whether to answer from documents, call a tool, or combine both. This avoids brittle routing logic and handles hybrid queries ("What's the remote work policy and how many vacation days do I have?") in a single turn.

### 2. Factory Pattern for Swappable Implementations

Three factory patterns are used:

| What | Options | How to swap |
|------|---------|-------------|
| LLM Provider | OpenAI, Anthropic | Change `LLM_PROVIDER` in .env |
| Embedding Provider | Local HuggingFace, OpenAI | Change `EMBEDDING_PROVIDER` in .env |
| Vector Store | In-memory, HNSWLib | Change `VECTOR_STORE` in .env |

Each factory reads config and returns the right implementation. The rest of the code depends on interfaces, not concrete classes.

### 3. Local Embeddings by Default

Embeddings run locally using HuggingFace Transformers (ONNX runtime in Node.js) with the `all-MiniLM-L6-v2` model. This means document ingestion works without any API key. Only the chat model requires an API key. You can switch to OpenAI embeddings for higher quality if needed.

### 4. In-Memory Vector Store by Default

The default vector store is `MemoryVectorStore` - documents are embedded and held in RAM. On restart, documents are re-ingested from disk. This keeps setup to zero external dependencies. HNSWLib is available as a persistent alternative (saves index to disk).

### 5. Tools as DynamicStructuredTool

The four HR tools (vacation, salary, directory, schedule) are defined directly in `ChatService` as LangChain `DynamicStructuredTool`  The agent knows when to call them based on their descriptions.

### 6. Session Management with BufferWindowMemory

Each conversation session has its own `BufferWindowMemory` (last 10 messages) stored in an in-memory `Map`. Sessions are created on first message and persist for the server's lifetime. Session ID is a UUID generated server-side or provided by the client.

---

## Data Flow: Document Ingestion

```
Startup / File Upload
        |
        v
  IngestionService
        |
  1. Read files from documents/ directory
  2. LoaderFactoryService picks loader by extension:
     .pdf -> PDFLoader (pdf-parse)
     .md  -> TextLoader
     .txt -> TextLoader
  3. RecursiveCharacterTextSplitter splits text into chunks
     (1000 chars, 200 overlap)
  4. Chunks sent to VectorStore.addDocuments()
     -> embedded via EMBEDDING_PROVIDER
     -> stored in MemoryVectorStore or HNSWLib
```

---



## Limitations

### No Persistence Across Restarts
- Sessions (conversation history) are lost on restart - stored in a `Map` in memory
- With the default memory vector store, all document embeddings are lost and must be re-generated on startup
- No database for anything


### No Streaming
- LLM responses are fully buffered before being sent back
- No streaming/SSE support for real-time token delivery

### Mock Data Is Random but Seeded
- `faker.seed(42)` makes data deterministic across restarts
- But the data is still fake - schedule dates use `new Date()` so they change daily


### ChatService Directly Depends on MockApiService
- `ChatService` injects `MockApiService` directly, not through an interface
- Swapping to a real HR API would require changing `ChatService`

---

## Trade-offs

### LLM-Based Routing vs. Explicit Intent Classification
- **Chosen:** Let the LLM decide when to use tools vs. documents
- **Pro:** Handles hybrid queries naturally, no maintenance of intent rules
- **Con:** Non-deterministic - the LLM might call tools when it shouldn't (or vice versa). Harder to test. Each request costs API tokens for the routing decision

### In-Memory Everything vs. External Services
- **Chosen:** Map-based sessions, in-memory vector store, no database
- **Pro:** Zero setup, zero dependencies beyond an API key. Run `npm start` and go
- **Con:** Nothing survives a restart. Can't scale horizontally (each instance has its own state). Memory grows unbounded with sessions

### Local Embeddings vs. API Embeddings
- **Chosen:** Local HuggingFace by default
- **Pro:** Free, works offline, no API key needed for document processing
- **Con:** Slower than API calls. Model quality (all-MiniLM-L6-v2, 384 dims) is lower than OpenAI's (text-embedding-3-small, 1536 dims). First run downloads ~30MB model

### Agent Recreated Per Request vs. Persistent Agent
- **Chosen:** A new `AgentExecutor` is constructed on every chat request
- **Pro:** Stateless design - each request gets fresh context. Easy to reason about
- **Con:** Overhead of constructing the agent each time. Could be cached per session

### RecursiveCharacterTextSplitter (Fixed Chunks) vs. Semantic Chunking
- **Chosen:** Fixed-size character splitting with 1000/200 overlap
- **Pro:** Simple, predictable, works for any document type
- **Con:** Can split mid-sentence or mid-paragraph. Semantic chunking (split by meaning) would give better retrieval quality but adds complexity

### Single Vector Store Search vs. Hybrid Search
- **Chosen:** Pure vector similarity search (cosine distance)
- **Pro:** Simple, works well for most questions
- **Con:** Keyword-heavy queries (exact names, policy numbers) may not retrieve well with embeddings alone. A hybrid approach combining vector search + BM25 keyword search would improve recall

---

## Assumptions

- **"Multi-modal content" = multiple file formats**, not multi-modal AI. We handle PDF, MD, TXT but extract text only -- no image/chart processing from PDFs.
- **The LLM handles routing** -- no separate intent classifier. We trust the model to decide when to use documents vs. tools based on tool descriptions.
- **Mock data is sufficient** for the external service requirement. The extrnal service is mocked.
- **Zod is the single validation library** -- used for both API DTOs and LangChain tool schemas. No class-validator.
- **In-memory defaults are acceptable** -- sessions and vector store live in RAM. HNSWLib is available for persistent storage when needed.
- **Re-ingestion on startup is fine** -- with the memory vector store, documents are re-embedded every restart (~seconds for small collections).
