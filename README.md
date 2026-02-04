# 🎯 Smart Resume Filter & AI HR Assistant

An AI-powered recruitment platform for automated candidate screening and interview evaluation.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Python](https://img.shields.io/badge/Python-3.10+-blue)

---

## ✨ Features

- **Resume Parsing** - NLP-based extraction of skills, education, experience
- **Job Matching** - AI-powered candidate ranking using semantic similarity
- **Interview Analysis** - Speech-to-text with sentiment & confidence scoring
- **Analytics Dashboard** - Visual insights and candidate comparisons
- **Detailed Reports** - Comprehensive candidate evaluation reports

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Zustand |
| **Backend** | FastAPI, Python 3.10+, spaCy, Sentence-BERT |
| **Database** | MongoDB Atlas |
| **ML/NLP** | spaCy, Transformers, OpenAI Whisper |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Copy environment file and configure
cp env.example .env
# Edit .env with your MongoDB URI and settings

# Start server
python run.py
```

API available at [http://localhost:8000](http://localhost:8000)  
API Docs at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```
├── app/                    # Next.js pages
│   ├── dashboard/         # Analytics dashboard
│   ├── upload-resume/     # Resume upload
│   ├── job-description/   # Job requirements
│   ├── results/           # Candidate rankings
│   ├── interview-analyzer/# Interview analysis
│   └── reports/[id]/      # Individual reports
├── components/            # React components
├── store/                 # Zustand state management
├── lib/                   # API client & utilities
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   └── services/     # ML/NLP services
│   └── requirements.txt
└── COMPLETE_DEPLOYMENT_GUIDE.md
```

---

## 🌐 Deployment

See **[COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)** for detailed deployment instructions using:

- **Frontend**: Vercel
- **Backend**: DigitalOcean
- **Database**: MongoDB Atlas
- **Domain**: Namecheap

---

## 🔐 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_REAL_API=true
```

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=smart_resume_filter
JWT_SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
```

See `backend/env.example` for all options.

---

## 👥 Team

**Group 40 - B.E. Computer Engineering (2025-26)**  
Sinhgad Academy of Engineering, Pune

- Adinath Sayaji Deshmukh (COBA63)
- Suyash Shamrao Ahire (COBA64)
- Raviraj Pandurang Malule (COBA68)
- Prajwal Nanaso Arjun (COBC10)

**Guide:** Prof. Mrs. T. S. Hashmi

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.
