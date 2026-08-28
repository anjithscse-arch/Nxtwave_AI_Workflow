Complete Specification

Project Overview \& Tech Stack



Project Overview

Build a full-stack RAG-Based College Chatbot called CampusMind that lets students ask natural-language questions about the college and get answers grounded strictly in admin-uploaded documents (PDFs, notices, FAQs, circulars). The platform must extract and chunk uploaded documents, generate embeddings, store and search them as vectors, run every question through a fixed pipeline of cooperating retrieval/guardrail/generation stages, stream live pipeline events to the browser, cite the exact source document and page for every answer, explicitly refuse to answer when no supporting content exists, and persist a full timeline of every query for auditing. A second, independently callable module — the Guardrail Layer — must detect and block prompt-injection and jailbreak attempts before they reach the LLM, and must be extractable as a standalone deliverable.



Tech Stack

Frontend: React (Vite), Tailwind CSS, Zustand, Axios, Socket.IO client, react-markdown, react-dropzone, and lucide-react icons.

Backend: Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, express-rate-limit, multer, pdf-parse, and bcryptjs.

AI Integration: Google Generative AI SDK (Gemini) for both embeddings and generation, with a deterministic rule-based fallback pipeline when no API key is configured.

Vector Store: MongoDB Atlas Vector Search — no separate Python service, no FAISS process. The vector index lives inside the same MongoDB cluster as every other collection.

Guardrail Classifier: JS-native (natural / ml.js) TF-IDF + logistic-regression classifier, wrapped behind a common interface so it can be swapped for a Python microservice later without touching the rest of the pipeline.



Authentication, Document Management, and RAG Pipeline Orchestration



Authentication

The authentication system must support registration, login, JWT-based session handling, protected routes, an /api/auth/me profile endpoint, role separation between admin and student, password hashing with bcrypt at cost factor 12, and persistent login state on the client through Zustand.



Document Management

Admins must be able to upload documents (PDF first-class, DOCX/TXT as stretch), tag each document with a topic category (Admissions, Departments, Courses, Fees, Exams, Academic Calendar, Hostel, Library, Clubs, Placements, Scholarships, Policies, Events, Other), list all documents with status (processing | indexed | failed), view chunk counts, delete a document (cascading delete of its chunks and immediate removal from the vector index), and re-trigger indexing on failure. Every document stores its filename, uploader, topic category, status, chunk count, and error message when applicable.



RAG Pipeline Orchestration

For every chat request, the backend must run the question through a fixed chain of stages:

Guardrail Agent: Screens the raw input through a rule-based filter and an ML classifier; blocks and classifies the reason (INSTRUCTION_OVERRIDE, ROLE_PLAY_JAILBREAK, PROMPT_EXTRACTION, ENCODED_PAYLOAD, ML_FLAGGED) before anything reaches embeddings or the LLM.

Retrieval Agent: Embeds the (allowed) question and runs a MongoDB Atlas $vectorSearch aggregation to return the top-k scored chunks.

Context Agent: Applies the similarity threshold; if no chunk clears it, short-circuits to a fixed "not found in knowledge base" response and skips generation entirely; otherwise assembles the prompt from conversation history + retrieved chunks.

Generation Agent: Calls Gemini to produce an answer strictly from the assembled context, and reports aiProvider: 'gemini' | 'fallback-deterministic' with each response.

Citation Agent: Extracts, deduplicates, and attaches the source filename and page number(s) actually used in the answer.

Monitoring Agent: Emits a Socket.IO event for every stage transition and writes one ChatLog row per stage.

The Generation Agent must fall back to a deterministic keyword/BM25-style extractive responder when GEMINI_API_KEY is not set, so local development and testing still work without an API key, and the response must clearly report which mode produced the answer.



Documents, Retrieval, Guardrail Layer, and Real-Time Layer



Document Ingestion Pipeline

The ingestion layer must, for every uploaded document: extract raw text and page boundaries with pdf-parse, split it into overlapping chunks (~500 tokens, 50-token overlap) on paragraph boundaries where possible, request embeddings from the Gemini embeddings endpoint in batches, write each chunk as its own MongoDB document carrying its embedding vector, and update the parent document's status only after every chunk is successfully written. Ingestion must run as a BullMQ background job on Redis, with an in-memory queue fallback when Redis is not configured, so an upload never blocks the HTTP request.



Retrieval & Similarity Search

Similarity search must be performed exclusively through a MongoDB Atlas Vector Search index (cosine similarity) defined on the chunk embedding field, filterable by docId. Top-k must be configurable (default 4–6) and a minimum-similarity threshold must be configurable and enforced before any chunk is allowed into the generation prompt. A missing or empty retrieval result must surface as an explicit NO_RELEVANT_CONTEXT outcome in the chat log, never as a silently hallucinated answer.



Standalone Guardrail Layer

The guardrail must run as two layers, in order, and must be implemented as an independently callable module with no dependency on Express request/response objects:

Layer 1 — Rule-Based Filter: normalizes input (lowercase, strip punctuation/homoglyphs) and matches it against a maintained JSON dataset of known attack phrasings (instruction-override, role-play jailbreak, system-prompt extraction, encoded payloads).

Layer 2 — ML Classifier: runs only on input that passes Layer 1; scores it with a TF-IDF + logistic-regression classifier trained on a labeled benign-vs-jailbreak dataset; blocks above a configurable confidence threshold.

On block, the system must never forward the input to Gemini, must return a block reason category (not the exact triggering rule/keyword, to prevent trivial bypass), and must log the event with blocked: true and blockReason. The guardrail module must be structured so it can be lifted, unmodified, and demoed standalone against a synthetic prompt dataset.



Real-Time Layer

The Socket.IO server must broadcast pipeline events (guardrail, retrieval, context, generation, citation, monitoring) for each chat request to the requesting client, and the client must render those events as a live status timeline while the answer is being produced. Admin-facing alerts (ingestion failures, repeated guardrail blocks from one session) must persist as notifications and appear in a notifications drawer.



Frontend Pages



The application is a single-page React app with client-side routing. The root / route redirects authenticated students to /chat, authenticated admins to /admin/documents, and unauthenticated users to /login.

/ – Landing page featuring platform introduction, RAG pipeline explainer, CTA buttons, and responsive layout with dark theme support.

/login – Form for email/password authentication with JWT handling, Zustand persistence, validation, and error states.

/register – Form for account creation with password validation, session persistence, and error handling.

/chat – Primary student console: message list with markdown-rendered answers, inline source citation chips (filename + page), a live pipeline-stage timeline driven by Socket.IO, and a composer input.

/history – List of the student's past chat sessions with the ability to reopen and continue a session.

/admin/documents – Admin document manager: drag-and-drop upload (react-dropzone), status table (processing/indexed/failed) with chunk counts, delete action, and a re-index button for failed documents.

/admin/guardrail-logs – Admin view of blocked requests with block reason categories, timestamps, and originating session, for security evaluation and reporting.

/settings – Profile management, role details, AI provider health check (Gemini configured vs. fallback mode), and theme settings.



Backend Architecture \& Database Collections



Backend Architecture

Routes: Handles HTTP routing, request validation via express-validator, and middleware composition (auth, validation, error handler).

Controllers: Request parsing and response shaping only (never talks directly to MongoDB).

Services: Business logic ownership (document CRUD, ingestion lifecycle, chat orchestration, auth, notification creation, chat-log aggregation).

Pipeline Layer: Holds guardrail, retrieval, context, generation, citation, and monitoring modules plus the orchestrator that chains them.

AI Provider Layer: Wraps the Gemini SDK (embeddings + generation) and the deterministic fallback behind a single common interface defined in baseAiProvider.js, so swapping or adding a provider never touches the pipeline layer.

Queues Layer: Wraps BullMQ and Redis for background document ingestion.

Config Layer: Centralizes environment variables, MongoDB connection (with in-memory fallback for local dev), Atlas Vector Search index bootstrap, and Socket.IO setup.



Database Collections

Users: Stores authenticated users (name, email, passwordHash with select: false, role: admin | student, lastLogin).

Documents: Stores uploaded documents (filename, topicCategory, uploadedBy, uploadedAt, status: processing | indexed | failed, numChunks, errorMessage).

Chunks: Stores retrievable text units (docId, text, pageNumber, embedding — indexed via Atlas Vector Search).

ChatSessions: Stores conversation sessions (userId, startedAt).

ChatMessages: Stores every turn (sessionId, role: user | assistant, content, retrievedSources, blocked, blockReason, aiProvider, createdAt).

ChatLogs: Stores granular pipeline timeline events (chatMessageId, sessionId, stage: guardrail | retrieval | context | generation | citation | monitoring, level: info | warning | error | blocked, message, metadata).

Notifications: Stores admin alerts (owner, documentId, type, title, message, isRead).



API Endpoints



Health and Auth

GET /api/health – System heartbeat and status check.

POST /api/auth/register – Register a new user account.

POST /api/auth/login – Authenticate user and issue JWT.

GET /api/auth/me – Fetch current user profile.



Documents (Admin)

GET /api/admin/documents – List all documents with status and chunk counts.

POST /api/admin/documents – Upload a document (multipart via multer); enqueues an ingestion job.

POST /api/admin/documents/:id/reindex – Re-trigger ingestion for a failed document.

DELETE /api/admin/documents/:id – Delete a document and cascade-delete its chunks.



Chat

POST /api/chat – Submit a question for the active session; runs the full pipeline; returns answer, sources, aiProvider, and blocked/blockReason when applicable.

GET /api/chat/sessions – List the current user's chat sessions.

GET /api/chat/sessions/:id/messages – Fetch full message history for a session.

GET /api/chat/messages/:id/timeline – Fetch the granular ChatLog pipeline timeline for one message.



Guardrail & Notifications (Admin)

GET /api/admin/guardrail-logs – List blocked requests with reason categories, for security evaluation and reporting.

GET /api/notifications – List admin notifications.



Folder Structure \& Development Phases



Frontend Structure

client/

└── src/

&#x20;   ├── components/

&#x20;   │   ├── AppShell/

&#x20;   │   ├── ChatWindow/

&#x20;   │   ├── SourceCitationChip/

&#x20;   │   ├── PipelineTimeline/

&#x20;   │   ├── DocumentUploader/

&#x20;   │   ├── DocumentStatusTable/

&#x20;   │   └── ProtectedRoute/

&#x20;   ├── pages/ (or routes/ if not using a meta-framework)

&#x20;   │   ├── Landing.jsx

&#x20;   │   ├── Login.jsx

&#x20;   │   ├── Register.jsx

&#x20;   │   ├── Chat.jsx

&#x20;   │   ├── History.jsx

&#x20;   │   ├── Settings.jsx

&#x20;   │   └── admin/

&#x20;   │       ├── Documents.jsx

&#x20;   │       └── GuardrailLogs.jsx

&#x20;   ├── store/

&#x20;   │   ├── authStore.js

&#x20;   │   └── chatStore.js

&#x20;   └── services/

&#x20;       ├── api.js

&#x20;       └── socket.js



Backend Structure

server/

└── src/

&#x20;   ├── config/

&#x20;   │   ├── env.js

&#x20;   │   ├── db.js

&#x20;   │   ├── vectorIndex.js

&#x20;   │   └── socket.js

&#x20;   ├── routes/

&#x20;   │   ├── authRoutes.js

&#x20;   │   ├── documentRoutes.js

&#x20;   │   ├── chatRoutes.js

&#x20;   │   └── notificationRoutes.js

&#x20;   ├── controllers/

&#x20;   │   ├── authController.js

&#x20;   │   ├── documentController.js

&#x20;   │   └── chatController.js

&#x20;   ├── services/

&#x20;   │   ├── authService.js

&#x20;   │   ├── documentService.js

&#x20;   │   ├── chatService.js

&#x20;   │   └── notificationService.js

&#x20;   ├── pipeline/

&#x20;   │   ├── orchestrator.js

&#x20;   │   ├── guardrailAgent.js

&#x20;   │   ├── retrievalAgent.js

&#x20;   │   ├── contextAgent.js

&#x20;   │   ├── generationAgent.js

&#x20;   │   ├── citationAgent.js

&#x20;   │   └── monitoringAgent.js

&#x20;   ├── guardrail/

&#x20;   │   ├── rules.js

&#x20;   │   ├── ruleDataset.json

&#x20;   │   └── classifier.js

&#x20;   ├── ai/

&#x20;   │   ├── baseAiProvider.js

&#x20;   │   ├── geminiProvider.js

&#x20;   │   └── deterministicFallbackProvider.js

&#x20;   ├── models/

&#x20;   │   ├── User.js

&#x20;   │   ├── Document.js

&#x20;   │   ├── Chunk.js

&#x20;   │   ├── ChatSession.js

&#x20;   │   ├── ChatMessage.js

&#x20;   │   ├── ChatLog.js

&#x20;   │   └── Notification.js

&#x20;   └── queues/

&#x20;       └── ingestionQueue.js



Development Phases

Phase 1: Project setup (Express + MongoDB with in-memory fallback, React client scaffold, JWT authentication, Zustand auth store, AppShell layout).

Phase 2: Document ingestion pipeline — upload, text extraction, chunking, embedding, Atlas Vector Search index bootstrap — plus the admin document manager UI.

Phase 3: Core RAG pipeline — Retrieval Agent, Context Agent, Generation Agent (Gemini primary, deterministic fallback), Citation Agent — wired to a minimal /api/chat endpoint and tested before any chat UI exists.

Phase 4: Guardrail Layer — rule-based filter and ML classifier — integrated as the first pipeline stage, plus the admin guardrail-logs view.

Phase 5: Background queues for ingestion, Socket.IO real-time pipeline timeline, chat history UI, and the notifications drawer.

Phase 6: Deployment Phase & Production Hardening
- Production Environment Templates: Provide `.env.production.example` for both backend and frontend.
- Backend Deployment: Deploy Express + Socket.IO server to a Node.js host with `MONGODB_URI` pointing to a real MongoDB Atlas cluster (with Atlas Vector Search index configured on `chunks.embedding`) and `REDIS_URL` pointing to managed Redis (e.g. Upstash).
- Database Fallback Safety Logging: `server/src/config/db.js` must log a visible warning whenever it falls back to `mongodb-memory-server` so the in-memory fallback is never mistaken for a real persistent deployment.
- Frontend Deployment: Deploy static Vite build (`npm run build`) to a static edge host (e.g. Vercel, Netlify, Cloudflare Pages, S3) with `VITE_API_URL` pointing to the deployed backend domain.
- Post-Deployment Smoke Check: Verify live Atlas connectivity, upload a real college document, confirm chunking & vector indexing, ask a grounded question, verify page-level citations, and verify guardrail prompt-injection blocking on the live URL.



UI, Security, Outcome, and Codex Instructions



UI and UX Requirements

The UI must use a clean chat-console aesthetic with Tailwind, be fully responsive, include loading states and skeleton loaders, render assistant answers as markdown, attach source citation chips (filename + page) beneath every grounded answer, render the live pipeline stage timeline with color-coded stage badges (guardrail / retrieval / context / generation / citation / monitoring), clearly visually distinguish a blocked response from a normal one, and provide a notifications drawer accessible from the AppShell.



Security Requirements

The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with JWT_SECRET, set HTTP security headers via helmet, apply CORS limited to CLIENT_URL, rate-limit both the auth endpoints and the chat endpoint via express-rate-limit, validate every request body with express-validator, never expose the exact guardrail rule or keyword that triggered a block, never log a document's raw file path to the client, and treat a missing/misconfigured GEMINI_API_KEY as an explicit AI_PROVIDER_FALLBACK state rather than a generic 500.



Verification & Quality Assurance

Automated Verification:
- Guardrail CLI Test Suite: Run standalone evaluator against 19+ synthetic adversarial prompts (instruction overrides, role play, prompt extractions, base64 payloads) and benign academic queries to confirm 100% accuracy.
- E2E API & Pipeline Suite: Automated verification of health checks, JWT auth, document listing, grounded queries with citations, out-of-domain refusals (`NO_RELEVANT_CONTEXT`), and guardrail audit logging.

Manual Verification & Deployed Environment Check:
- Local Verification: Test drag-and-drop upload in Admin portal, run grounded queries in Student console, observe live Socket.IO timeline events.
- Deployed Environment Check: Repeat the admin-upload and student-chat test against the live deployed URL (not localhost), and confirm data survives a backend restart to prove it's on real Atlas storage.



Final Expected Outcome

The completed platform must let a student ask a college-related question in plain English, watch the pipeline stages resolve live, receive an answer grounded only in uploaded documents with its exact source cited, be told plainly when no answer exists in the knowledge base, and have every query — including blocked ones — recorded in a full audit trail in MongoDB. The guardrail module must double as a standalone, demoable deliverable. The final application should feel like a focused, trustworthy campus help-desk assistant — not a general-purpose chatbot wearing a college skin.



Codex & AI Agent Implementation Instructions

The AI coding agent must build the application phase by phase, follow the folder structure strictly, keep controllers thin and push logic into services, keep pipeline agents pure (no HTTP knowledge), wrap every AI provider behind the baseAiProvider interface, never call Mongo from a controller, never call the Gemini SDK from a pipeline agent without going through the AI provider layer, treat every secret as process.env, use the in-memory store/queue fallback when Mongo or Redis is unavailable so local dev still works without external services, emit a Socket.IO event for every pipeline stage, write one ChatLog row per stage, and report the list of files created or changed at the end of every phase.



Where Each Specification Parameter Shows Up



Looking at the specification above, you can see how the parameters of a good specification appear in practice:

Clarity: The Project Overview and Final Expected Outcome sections describe the product in single-meaning sentences and explicitly identify the primary user ("student") and the primary refusal behavior (never answer outside the knowledge base).

Completeness: The document covers all technical facets: stack, ingestion, retrieval, guardrail, generation, pages, database schemas, endpoints, queues, real-time layer, and verification.

Consistency: The six pipeline stage names defined in RAG Pipeline Orchestration match the stage names used in the Real-Time Layer, the UI and UX Requirements color-coded badges, and the ChatLogs schema's stage enum.

Concrete Technology Choices: The Tech Stack section locks down explicit dependencies — React (Vite), MongoDB Atlas Vector Search, BullMQ on ioredis, Socket.IO, Gemini — eliminating ambiguity for an AI coding agent and avoiding a silent drift back to a Python/FAISS stack.

Structured Sections: Heading levels organize details into scannable sub-domains for both human reviewers (your mentor) and AI parsers (a coding agent or Codex-style tool).

Phased Delivery: The Development Phases section breaks the build into six sequential checkpoints, each ending in a functional, testable surface.

Authoritative Tone: Prescriptive language ("must", "shall") prevents an AI coding agent from skipping the guardrail layer, the citation requirement, or the "not found" refusal behavior — the three things a grader is most likely to specifically test.

