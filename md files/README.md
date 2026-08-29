# HireQ

AI-powered recruitment platform for intelligent candidate screening and interview evaluation.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Python](https://img.shields.io/badge/Python-3.10+-blue)

---

## Features

- **Resume Parsing** - NLP-based extraction of skills, education, and experience
- **Job Matching** - AI-powered candidate ranking using semantic similarity
- **Interview Analysis** - Speech-to-text with sentiment and confidence scoring
- **AI Chatbot** - RAG-powered assistant for querying candidate/job data
- **Real-time Updates** - WebSocket-driven live notifications
- **Analytics Dashboard** - Visual insights, charts, and candidate comparisons
- **Detailed Reports** - Comprehensive candidate evaluation with PDF export

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand |
| **Backend** | FastAPI, Python 3.10+, MongoDB (Beanie ODM) |
| **ML/NLP** | spaCy, Sentence-BERT, Transformers, OpenAI Whisper |
| **AI Chat** | Google Gemini API, ChromaDB (RAG) |
| **Real-time** | WebSockets |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### Frontend

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Copy environment file and configure
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Gemini API key

# Start server
python run.py
```

API: [http://localhost:8000](http://localhost:8000)
Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Project Structure

```
hireq/
├── app/                          # Next.js pages (App Router)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Authentication
│   ├── dashboard/                # Analytics dashboard
│   ├── upload-resume/            # Resume upload & parsing
│   ├── job-description/          # Job requirements & screening
│   ├── jobs/                     # Job management (CRUD)
│   ├── results/                  # Candidate rankings & pipeline
│   ├── interview-analyzer/       # Interview upload & analysis
│   ├── reports/[id]/             # Individual candidate reports
│   └── profile/                  # User profile & settings
│
├── components/
│   ├── ui/                       # Reusable base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── FileUpload.tsx
│   │   └── ThemeToggle.tsx
│   ├── layout/                   # Structural layout components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── LayoutContent.tsx
│   └── features/                 # Feature-specific components
│       ├── ChatBot.tsx
│       ├── Charts.tsx
│       └── RealtimeIndicator.tsx
│
├── contexts/                     # React context providers
│   └── ThemeContext.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useChat.ts
│   └── useRealtimeUpdates.ts
│
├── lib/                          # API clients & utilities
│   ├── api.ts                    # Real API client
│   ├── apiClient.ts              # API abstraction layer
│   └── mockApi.ts                # Mock API fallback
│
├── store/                        # State management
│   └── useStore.ts               # Zustand store
│
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # Application entry point
│   │   ├── config.py             # Settings & configuration
│   │   ├── database.py           # MongoDB connection
│   │   ├── models/               # Beanie document models
│   │   ├── routes/               # API endpoint handlers
│   │   └── services/             # ML/NLP business logic
│   ├── .env.example              # Environment template
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container configuration
│   └── run.py                    # Dev server launcher
│
├── docs/                         # Documentation
│   └── deployment.md             # Deployment guide
│
├── .env.example                  # Frontend env template
├── package.json                  # Node.js dependencies
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment config
```

---

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_REAL_API=true
```

### Backend (`.env`)

```env
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=hireq
JWT_SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
```

See `backend/.env.example` for the complete list.

---

## Deployment

See [docs/deployment.md](./docs/deployment.md) for step-by-step deployment instructions using:

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.
