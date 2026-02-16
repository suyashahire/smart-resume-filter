# HireQ - Backend

FastAPI backend with MongoDB, ML/NLP services, and real-time capabilities for intelligent recruitment.

## Quick Start

### Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)

### Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
python run.py
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI application
│   ├── config.py                     # Configuration settings
│   ├── database.py                   # MongoDB connection
│   ├── models/                       # Beanie document models
│   │   ├── user.py                   # User accounts
│   │   ├── resume.py                 # Parsed resumes
│   │   ├── job.py                    # Job descriptions
│   │   ├── interview.py              # Interview recordings
│   │   ├── screening.py              # Screening results
│   │   └── conversation.py           # Chat conversations
│   ├── routes/                       # API endpoints
│   │   ├── auth.py                   # Authentication
│   │   ├── resumes.py                # Resume management
│   │   ├── jobs.py                   # Job management
│   │   ├── interviews.py             # Interview processing
│   │   ├── reports.py                # Report generation
│   │   ├── chat.py                   # AI chatbot
│   │   └── realtime.py               # WebSocket events
│   └── services/                     # Business logic
│       ├── resume_parser.py          # NLP-based resume parsing
│       ├── job_parser.py             # Job description parsing
│       ├── matching.py               # Candidate-job matching (Sentence-BERT)
│       ├── transcription.py          # Speech-to-text (Whisper)
│       ├── sentiment.py              # Interview sentiment analysis
│       ├── report_generator.py       # PDF report generation
│       ├── chatbot.py                # Gemini AI chatbot
│       ├── rag.py                    # RAG with ChromaDB
│       └── websocket_manager.py      # Real-time event broadcasting
├── .env.example                      # Environment template
├── requirements.txt                  # Python dependencies
├── Dockerfile                        # Container configuration
└── run.py                            # Dev server launcher
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login (OAuth2 form) |
| POST | `/login/json` | Login (JSON body) |
| GET | `/me` | Get current user |
| PUT | `/me` | Update current user |

### Resumes (`/api/resumes`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload and parse a resume |
| POST | `/upload/batch` | Upload multiple resumes (max 20) |
| GET | `/` | List all resumes (paginated) |
| GET | `/{id}` | Get resume by ID |
| GET | `/{id}/download` | Download original file |
| DELETE | `/{id}` | Delete resume |
| POST | `/{id}/reparse` | Re-parse a resume |

### Jobs (`/api/jobs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create job description |
| GET | `/` | List all jobs |
| GET | `/{id}` | Get job by ID |
| PUT | `/{id}` | Update job |
| DELETE | `/{id}` | Delete job |
| POST | `/{id}/screen` | Screen candidates against job |
| GET | `/{id}/results` | Get screening results |

### Interviews (`/api/interviews`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload interview recording |
| POST | `/{id}/transcribe` | Transcribe audio |
| POST | `/{id}/analyze` | Analyze sentiment |
| POST | `/{id}/process` | Transcribe + analyze (combined) |
| GET | `/` | List all interviews |
| GET | `/{id}` | Get interview by ID |
| DELETE | `/{id}` | Delete interview |

### Reports (`/api/reports`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{resume_id}` | Get candidate report (JSON) |
| GET | `/{resume_id}/pdf` | Download PDF report |
| GET | `/dashboard/stats` | Get dashboard statistics |

### Chat (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/message` | Send message to AI chatbot |
| POST | `/message/anonymous` | Send message (no auth) |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{id}` | Get conversation history |
| DELETE | `/conversations/{id}` | Delete conversation |
| POST | `/reindex` | Reindex documents for RAG |
| GET | `/status` | Chatbot and RAG status |

### Real-time (`/api/realtime`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/ws` | WebSocket for live updates |
| GET | `/connections` | Connection statistics |

---

## ML/NLP Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| Resume Parser | spaCy NER | Extract name, skills, education, experience |
| Job Matching | Sentence-BERT | Semantic similarity scoring (70% skills, 20% exp, 10% edu) |
| Transcription | OpenAI Whisper (local) | Speech-to-text for interviews |
| Sentiment Analysis | DistilBERT | Confidence, clarity, enthusiasm scoring |
| AI Chatbot | Google Gemini | Context-aware Q&A about candidates/jobs |
| RAG | ChromaDB + Sentence-BERT | Vector search for chatbot context |

---

## Configuration

See `.env.example` for all available environment variables.

Key settings:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key
WHISPER_MODEL=base
```

---

## License

MIT License - HireQ
