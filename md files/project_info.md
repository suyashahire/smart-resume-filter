# HireQ Project Info

## Overview

HireQ is an AI-powered recruitment platform for screening candidates, matching resumes to jobs, analyzing interviews, and improving communication between recruiters and applicants.

The repository contains:

- A public marketing site
- An HR/recruiter portal
- A candidate portal
- An admin panel
- A FastAPI backend with MongoDB and AI/ML services

---

## Main Features

- Resume upload and parsing
- Job description creation and skill extraction
- Candidate-job matching with weighted scoring
- Candidate applications with approval-based or auto-include flows
- Interview upload, transcription, and sentiment/confidence analysis
- Candidate reports with PDF export
- HR-candidate direct messaging
- Real-time updates over WebSockets
- AI chatbot with RAG-backed context
- Admin approval workflow for HR accounts

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Backend | FastAPI, Uvicorn, Python 3.10+, Beanie ODM, Motor |
| Database | MongoDB |
| AI/NLP | spaCy, Sentence-Transformers, Transformers, Whisper |
| Chat/RAG | Google Gemini, ChromaDB |
| Realtime | WebSockets |
| Deployment | Docker, Vercel, Render, MongoDB Atlas, optional self-hosting |

---

## Product Areas

### 1. Public Site

The landing page explains the platform and its AI capabilities.

Key areas:

- Hero and product marketing sections
- Infrastructure and AI showcase sections
- Candidate-focused call to actions

### 2. HR Portal

Used by recruiters and hiring managers to:

- Log in and manage jobs
- Upload resumes
- Screen and rank candidates
- Upload interviews and analyze them
- Review reports
- Message candidates
- View dashboards and notifications

### 3. Candidate Portal

Used by job seekers to:

- Register and log in
- Browse open jobs
- Save jobs
- Upload and manage resumes
- Apply to jobs
- Track application status
- Chat with recruiters
- Receive feedback and notifications

### 4. Admin Panel

Used by platform admins to:

- Approve or reject HR accounts
- View user statistics
- Manage platform users
- Toggle user activation
- Delete users

---

## High-Level Architecture

### Frontend

The frontend uses the Next.js App Router and is organized by route groups under `app/`.

Important frontend concepts:

- Shared HR layout for authenticated recruiter pages
- Separate candidate layout
- Separate admin layout
- Central API client in `lib/api.ts`
- Global browser state in `store/useStore.ts`
- Realtime updates through `hooks/useRealtimeUpdates.ts`

Frontend responsibilities:

- Rendering dashboards and workflows
- Handling client-side auth state
- Calling backend APIs
- Maintaining selected local UI state
- Showing offline/mock fallbacks for some features

### Backend

The backend is a FastAPI application that:

- Connects to MongoDB with Beanie
- Loads AI/ML services on startup when possible
- Exposes REST APIs for all product areas
- Handles JWT authentication and role-based authorization
- Sends real-time events over WebSockets

Key backend responsibilities:

- User authentication and account approval
- Resume ingestion and parsing
- Job management and screening
- Candidate applications and resume versioning
- Interview transcription and analysis
- Messaging and notifications
- Report generation
- Chatbot and RAG services

### Data Storage

The main persistent storage is MongoDB. The app also stores files locally in the `uploads/` directory.

Stored data includes:

- Users
- Resumes
- Jobs
- Applications
- Screening results
- Interviews
- Conversations and direct messages
- Notifications

Additional local storage:

- Uploaded resumes
- Uploaded interview files
- Generated reports
- ChromaDB vector index for RAG

---

## AI / ML Services

### Resume Parsing

Resume parsing is powered by spaCy plus regex-based extraction logic. It extracts:

- Name
- Email
- Phone
- Skills
- Education
- Experience
- LinkedIn and GitHub links
- Estimated years of experience

### Candidate Matching

Candidate matching uses Sentence-BERT embeddings when available, combined with exact and partial matching logic.

Scoring weights:

- Skills: 70%
- Experience: 20%
- Education: 10%

### Interview Analysis

Interview processing supports:

- Audio/video upload
- Whisper-based transcription
- Sentiment and confidence scoring
- Final score updates to screening results

### Chatbot and RAG

The chatbot supports both HR and candidate contexts.

It uses:

- Google Gemini for generation
- ChromaDB for retrieval
- Indexed job and resume content for context-aware answers

---

## Main Workflows

### HR Flow

1. Recruiter signs up or logs in.
2. Recruiter creates a job description.
3. The backend extracts required skills from the description.
4. Recruiter uploads resumes or candidates apply through the portal.
5. Screening produces weighted candidate scores.
6. Recruiter can upload an interview recording for deeper analysis.
7. Reports and dashboard stats summarize the candidate pipeline.

### Candidate Flow

1. Candidate signs up or logs in.
2. Candidate browses open jobs.
3. Candidate uploads a primary or versioned resume.
4. Candidate applies to a job.
5. Application enters either:
   - `auto_include`, where it is screened automatically
   - `require_approval`, where HR approves before screening
6. Candidate tracks application progress and can message HR.

### Admin Flow

1. HR accounts register.
2. Admin reviews pending accounts.
3. Admin approves or rejects them.
4. Approved HR users gain normal access to recruiter workflows.

### Realtime Flow

The backend emits WebSocket events for updates such as:

- Resume uploads
- Job creation and deletion
- New applications
- Application status changes
- New messages
- Typing indicators
- Message read events

---

## Important Directories

```text
app/                    Next.js routes
components/             Reusable UI and feature components
contexts/               React context providers
hooks/                  Custom frontend hooks
lib/                    API client and mock API helpers
store/                  Zustand state store
public/                 Static assets
sections/               Landing page sections
backend/app/            FastAPI application
backend/app/models/     Beanie document models and schemas
backend/app/routes/     REST and WebSocket routes
backend/app/services/   AI, email, reporting, realtime services
docs/                   Additional documentation
deploy/                 Deployment scripts and configs
```

---

## Backend API Areas

### Authentication

- Register
- Login
- Logout
- Current user
- Profile update
- Password change
- Account deletion

### Resumes

- Upload one or many resumes
- List resumes
- Download resume files
- Delete and reparse resumes

### Jobs

- Create, list, update, delete jobs
- Screen resumes against jobs
- View screening results
- Approve or reject candidate applications
- Update application status

### Candidate

- Browse open jobs
- Save and unsave jobs
- Apply to jobs
- View application timeline
- Upload and manage resume versions
- View dashboard stats
- Manage candidate profile

### Interviews

- Upload interview recordings
- Transcribe interviews
- Analyze interviews
- Combined processing

### Reports

- Candidate report JSON
- Candidate report PDF
- Dashboard statistics

### Messaging

- List conversations
- Read messages
- Send messages
- Mark messages as read
- Send typing indicators

### Notifications

- List notifications
- Mark one or all as read
- Delete one or all

### Chat

- Send chat messages
- Anonymous fallback messages
- View conversations
- Reindex RAG
- Status and health endpoints

---

## Authentication and Authorization

Authentication is based on JWT tokens.

Important details:

- Tokens are stored client-side and mirrored to a cookie for middleware checks
- The frontend middleware performs coarse route gating
- The backend performs actual JWT validation and role checks
- Roles include:
  - `hr_manager`
  - `candidate`
  - `admin`
  - `viewer`

HR accounts require admin approval before they can use the platform normally.

---

## State Management

The frontend uses Zustand with persistence.

It stores:

- Auth state
- Job and candidate assignment state
- Shortlists
- Notes and tags
- Activity feed
- Candidate messaging state

Important nuance:

- Some data is fetched from the backend after login
- Some UI state is persisted locally
- The app can operate in real API mode or limited mock/offline mode

---

## Security and Validation

The project already includes several safety measures:

- JWT auth
- Role-based access control
- Rate limiting
- CORS configuration
- Security headers
- File extension checks
- Magic-byte validation for uploads
- Basic text sanitization to reduce stored XSS risk
- Account lockout after repeated failed logins

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB

### Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
python run.py
```

Frontend default:

- `http://localhost:3000`

Backend default:

- `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

---

## Important Environment Variables

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=
```

### Backend

```env
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=hireq
JWT_SECRET_KEY=change-me
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=
RESEND_API_KEY=
WHISPER_MODEL=base
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
UPLOAD_DIR=uploads
```

---

## Deployment

The repo supports multiple deployment styles:

- Local Docker Compose
- Vercel for frontend
- Render for backend
- MongoDB Atlas for database
- Fully self-hosted Docker Compose with production overrides

Files involved:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `deploy/`
- `vercel.json`

---

## Notes and Current Observations

- The project is more than a demo UI. It has full workflows for HR, candidates, and admins.
- The chatbot supports separate HR and candidate contexts.
- There is offline/mock support in parts of the frontend.
- Redis appears in Docker configuration, but current app code does not seem to use it directly.
- No obvious automated test suite or test files are present in the repository right now.

---

## Suggested Reading Order

If you want to understand the codebase quickly, read files in this order:

1. `README.md`
2. `backend/README.md`
3. `app/`
4. `lib/api.ts`
5. `store/useStore.ts`
6. `backend/app/main.py`
7. `backend/app/routes/`
8. `backend/app/services/`

