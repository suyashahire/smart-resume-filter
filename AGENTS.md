# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HireQ is an AI-powered recruitment platform with a **Next.js 14 frontend** (port 3000) and a **FastAPI backend** (port 8000), using **MongoDB** as the primary database. See `README.md` for the full tech stack and project structure.

### Required services

| Service | How to start | Port |
|---------|-------------|------|
| MongoDB | `sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log` | 27017 |
| Backend | `cd backend && source venv/bin/activate && TOKENIZERS_PARALLELISM=false python run.py` | 8000 |
| Frontend | `npm run dev` (from repo root) | 3000 |

Start MongoDB first, then the backend (it connects to MongoDB on startup and pre-loads ML models), then the frontend.

### Lint / type-check / build

- **Frontend lint**: `npx next lint` (warnings only, no errors expected)
- **TypeScript check**: `npx tsc --noEmit`
- **Frontend build**: `npm run build`
- **Backend syntax check**: `cd backend && source venv/bin/activate && python -m py_compile app/main.py`
- **Backend import verification**: `cd backend && source venv/bin/activate && python -c "from app.main import app; print('OK')"`

### Non-obvious caveats

- **Python 3.11 required**: The backend pins `torch==2.1.2` which does not support Python 3.12+. Python 3.11 is installed from the deadsnakes PPA and the venv is created with `python3.11 -m venv venv`.
- **openai-whisper build**: `openai-whisper==20231117` requires `setuptools` at build time. Install it with `pip install setuptools wheel` before running `pip install -r requirements.txt`, or use `--no-build-isolation`.
- **resend version**: `resend==2.5.0` in `requirements.txt` does not exist on PyPI. Install the rest of the requirements first (filtering out that line), then `pip install 'resend>=2.5.0,<3.0'`.
- **spaCy model**: After installing requirements, download the model: `pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl` (the `python -m spacy download en_core_web_sm` command can fail in some environments).
- **HR user activation**: New HR users register with `account_status: "pending"`. To test, activate via MongoDB: `mongosh --eval 'db.getSiblingDB("hireq").users.updateOne({email:"..."}, {$set:{is_active:true, account_status:"approved"}})'`.
- **Backend .env**: Config loads from `backend/.env`; the `config.py` `Settings` class uses pydantic-settings with `env_file = ".env"`, so the working directory when starting the backend must be `backend/`.
- **Optional APIs**: Gemini (chatbot), Resend (email), AWS S3 (file storage), and Sentry (error tracking) all degrade gracefully when their keys are empty.
