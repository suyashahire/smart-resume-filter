# HireQ - Backend

HireQ backend API built with FastAPI, MongoDB, and ML/NLP services for intelligent recruitment.

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)
- pip or conda

### Installation

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Download spaCy model:**
```bash
python -m spacy download en_core_web_sm
```

4. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your settings
```

5. **Start MongoDB:**
```bash
# If using local MongoDB
mongod --dbpath /path/to/data
```

6. **Run the server:**
```bash
python run.py
# Or with uvicorn directly:
uvicorn app.main:app --reload --port 8000
```

7. **Access API docs:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── models/              # Pydantic/Beanie models
│   │   ├── user.py
│   │   ├── resume.py
│   │   ├── job.py
│   │   ├── interview.py
│   │   └── screening.py
│   ├── routes/              # API endpoints
│   │   ├── auth.py
│   │   ├── resumes.py
│   │   ├── jobs.py
│   │   ├── interviews.py
│   │   └── reports.py
│   └── services/            # ML/NLP services
│       ├── resume_parser.py
│       ├── job_parser.py
│       ├── matching.py
│       ├── transcription.py
│       ├── sentiment.py
│       └── report_generator.py
├── uploads/                  # File storage
├── requirements.txt
├── env.example
└── run.py
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload & parse resume |
| POST | `/api/resumes/upload/batch` | Upload multiple resumes |
| GET | `/api/resumes` | List all resumes |
| GET | `/api/resumes/{id}` | Get resume by ID |
| DELETE | `/api/resumes/{id}` | Delete resume |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create job description |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/{id}` | Get job by ID |
| PUT | `/api/jobs/{id}` | Update job |
| DELETE | `/api/jobs/{id}` | Delete job |
| POST | `/api/jobs/{id}/screen` | Screen candidates |
| GET | `/api/jobs/{id}/results` | Get screening results |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/upload` | Upload interview |
| POST | `/api/interviews/{id}/transcribe` | Transcribe audio |
| POST | `/api/interviews/{id}/analyze` | Analyze sentiment |
| POST | `/api/interviews/{id}/process` | Transcribe + Analyze |
| GET | `/api/interviews` | List interviews |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/{resume_id}` | Get candidate report |
| GET | `/api/reports/{resume_id}/pdf` | Download PDF report |
| GET | `/api/reports/dashboard/stats` | Get dashboard stats |

## 🧠 ML/NLP Services

### Resume Parser
- Extracts text from PDF/DOCX files
- Uses spaCy NER for name extraction
- Regex patterns for email, phone, LinkedIn, GitHub
- Skill matching against 100+ known skills
- Education and experience section detection

### Job Matching
- Sentence-BERT for semantic similarity
- Exact, partial, and semantic skill matching
- Weighted scoring: 70% skills, 20% experience, 10% education
- Recommendation categories: Highly Recommended, Recommended, Maybe, Not Recommended

### Interview Analysis
- OpenAI Whisper for speech-to-text
- Hugging Face transformers for sentiment analysis
- Confidence scoring based on language patterns
- Clarity, enthusiasm, and professionalism metrics

## 🔧 Configuration

Key environment variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=hireq

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI (for Whisper)
OPENAI_API_KEY=sk-your-key

# ML Models
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
```

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/
```

## 📝 License

MIT License - HireQ

