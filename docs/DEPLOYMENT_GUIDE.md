# HireQ - Complete Deployment Guide

This guide covers everything you need to deploy HireQ to production, including all required services, API keys, and configurations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Required Services & API Keys](#required-services--api-keys)
3. [Environment Variables](#environment-variables)
4. [Database Setup (MongoDB)](#database-setup-mongodb)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [File Storage (AWS S3)](#file-storage-aws-s3)
8. [Email Service Setup](#email-service-setup)
9. [Messaging System](#messaging-system)
10. [AI/ML Services](#aiml-services)
11. [Security Checklist](#security-checklist)
12. [Monitoring & Logging](#monitoring--logging)
13. [Scaling Considerations](#scaling-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js on Vercel)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  HR Portal   │  │  Candidate   │  │   Admin Dashboard    │  │
│  │              │  │   Portal     │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│              (FastAPI on Railway/Render/AWS)                    │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │    Auth    │  │   Resume   │  │  Interview │  │ Messaging│  │
│  │   (JWT)    │  │   Parser   │  │ Transcribe │  │  System  │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ AI Chatbot │  │  Matching  │  │ Sentiment  │  │  Reports │  │
│  │  (Gemini)  │  │  Engine    │  │  Analysis  │  │Generator │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ MongoDB  │       │  AWS S3  │       │  Email   │
    │ (Atlas)  │       │ (Files)  │       │(Resend)  │
    └──────────┘       └──────────┘       └──────────┘
```

---

## Required Services & API Keys

### Essential (Required)

| Service | Purpose | Cost | Get It |
|---------|---------|------|--------|
| **MongoDB Atlas** | Database | Free tier available | [mongodb.com/atlas](https://www.mongodb.com/atlas) |
| **Vercel** | Frontend hosting | Free tier available | [vercel.com](https://vercel.com) |
| **Railway/Render** | Backend hosting | ~$5-20/month | [railway.app](https://railway.app) or [render.com](https://render.com) |

### Recommended (For Full Features)

| Service | Purpose | Cost | Get It |
|---------|---------|------|--------|
| **Google Gemini API** | AI Chatbot | Free tier (60 req/min) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **AWS S3** | File storage | ~$0.023/GB | [aws.amazon.com/s3](https://aws.amazon.com/s3) |
| **Resend** | Email service | Free tier (100/day) | [resend.com](https://resend.com) |
| **Sentry** | Error tracking | Free tier available | [sentry.io](https://sentry.io) |

### Optional (Enhanced Features)

| Service | Purpose | Cost | Get It |
|---------|---------|------|--------|
| **Redis** | Caching & sessions | Free on Upstash | [upstash.com](https://upstash.com) |
| **Cloudflare** | CDN & protection | Free tier available | [cloudflare.com](https://cloudflare.com) |

---

## Environment Variables

### Backend (.env file)

Create a `.env` file in the `backend/` directory:

```bash
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=8000
HOST=0.0.0.0
DEBUG=false
ENVIRONMENT=production

# =============================================================================
# DATABASE (MongoDB Atlas)
# =============================================================================
# Get this from MongoDB Atlas > Connect > Drivers > Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=hireq_production

# =============================================================================
# AUTHENTICATION (JWT)
# =============================================================================
# Generate a strong secret: openssl rand -hex 64
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-64-characters-long-for-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# =============================================================================
# FRONTEND URL (CORS)
# =============================================================================
# Your deployed frontend URL (no trailing slash)
FRONTEND_URL=https://your-app.vercel.app

# =============================================================================
# FILE STORAGE (AWS S3) - Optional, uses local storage if not set
# =============================================================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=hireq-uploads
AWS_REGION=us-east-1

# =============================================================================
# AI CHATBOT (Google Gemini) - Optional
# =============================================================================
# Get free API key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# =============================================================================
# EMAIL SERVICE (Resend) - Optional
# =============================================================================
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# =============================================================================
# ML MODELS (Already configured with defaults)
# =============================================================================
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
WHISPER_MODEL=base

# =============================================================================
# FILE UPLOAD LIMITS
# =============================================================================
MAX_FILE_SIZE_MB=10
ALLOWED_RESUME_EXTENSIONS=.pdf,.docx
ALLOWED_AUDIO_EXTENSIONS=.mp3,.wav,.m4a,.mp4
```

### Frontend (.env.local file)

Create a `.env.local` file in the root directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# App URL (for callbacks, sharing, etc.)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Database Setup (MongoDB)

### Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free
3. Create a new project called "HireQ"

### Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose **M0 Sandbox** (Free tier)
3. Select a region close to your users
4. Name your cluster (e.g., "hireq-cluster")

### Step 3: Configure Access

1. **Database Access**: Create a database user
   - Click "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create username and strong password
   - Give "Read and write to any database" permission

2. **Network Access**: Allow connections
   - Click "Network Access" → "Add IP Address"
   - For development: "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your server's IP address only

### Step 4: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Python" and version "3.12 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password

```bash
# Example connection string
MONGODB_URI=mongodb+srv://hireq_admin:YourSecurePassword@hireq-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
```

### Step 5: Create Indexes (Run once after deployment)

```python
# Connect to MongoDB and run:
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(MONGODB_URI)
db = client.hireq_production

# Create indexes for better performance
await db.users.create_index("email", unique=True)
await db.resumes.create_index("user_id")
await db.job_descriptions.create_index("created_by")
await db.direct_messages.create_index([("conversation_id", 1), ("sent_at", -1)])
await db.direct_conversations.create_index("hr_user_id")
await db.direct_conversations.create_index("candidate_user_id")
```

---

## Backend Deployment

### Option 1: Railway (Recommended)

Railway offers easy deployment with automatic HTTPS and scaling.

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Initialize Project

```bash
cd backend
railway init
```

#### Step 3: Add Environment Variables

```bash
# Add all your environment variables
railway variables set MONGODB_URI="your-connection-string"
railway variables set JWT_SECRET_KEY="your-secret-key"
railway variables set FRONTEND_URL="https://your-app.vercel.app"
railway variables set GEMINI_API_KEY="your-gemini-key"
# ... add all other variables
```

#### Step 4: Create Procfile

Create `backend/Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Step 5: Create runtime.txt

Create `backend/runtime.txt`:

```
python-3.11.0
```

#### Step 6: Deploy

```bash
railway up
```

#### Step 7: Get Your Backend URL

```bash
railway domain
# Returns something like: hireq-backend-production.up.railway.app
```

### Option 2: Render

#### Step 1: Create render.yaml

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: hireq-backend
    env: python
    buildCommand: pip install -r requirements.txt && python -m spacy download en_core_web_sm
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

#### Step 2: Deploy on Render

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select the backend directory
4. Add environment variables
5. Deploy

### Option 3: AWS EC2 / DigitalOcean

For more control, deploy on a VPS:

```bash
# SSH into your server
ssh user@your-server

# Install dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv nginx certbot

# Clone your repository
git clone https://github.com/yourusername/hireq.git
cd hireq/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Create .env file
nano .env
# Add all environment variables

# Install and configure supervisor
sudo apt install supervisor

# Create supervisor config
sudo nano /etc/supervisor/conf.d/hireq.conf
```

```ini
[program:hireq]
command=/home/user/hireq/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/home/user/hireq/backend
user=user
autostart=true
autorestart=true
stderr_logfile=/var/log/hireq/err.log
stdout_logfile=/var/log/hireq/out.log
```

```bash
# Start the service
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start hireq

# Configure Nginx
sudo nano /etc/nginx/sites-available/hireq
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/hireq /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Deploy to Vercel (Recommended)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Select the repository

#### Step 3: Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### Step 4: Add Environment Variables

In Vercel dashboard, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Step 5: Deploy

Click "Deploy" and wait for the build to complete.

#### Step 6: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `hireq.yourdomain.com`)
3. Configure DNS:
   - Add CNAME record pointing to `cname.vercel-dns.com`

---

## File Storage (AWS S3)

### Step 1: Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Name: `hireq-uploads` (must be globally unique)
4. Region: Choose one close to your users
5. Uncheck "Block all public access" (for resume downloads)
6. Enable versioning (recommended)

### Step 2: Configure Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::hireq-uploads/public/*"
        }
    ]
}
```

### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user: `hireq-s3-user`
3. Attach policy: `AmazonS3FullAccess` (or create custom policy)
4. Generate access keys
5. Save `Access Key ID` and `Secret Access Key`

### Step 4: Configure CORS

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://your-app.vercel.app"],
        "ExposeHeaders": ["ETag"]
    }
]
```

---

## Email Service Setup

### Option 1: Resend (Recommended)

Resend is modern, developer-friendly, and has a generous free tier.

#### Step 1: Create Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email

#### Step 2: Add Domain (For Production)

1. Go to Domains → Add Domain
2. Add your domain (e.g., `mail.yourdomain.com`)
3. Add the DNS records shown
4. Wait for verification

#### Step 3: Get API Key

1. Go to API Keys
2. Create new key with "Sending access"
3. Copy the key (starts with `re_`)

#### Step 4: Add Email Service to Backend

Create `backend/app/services/email.py`:

```python
"""
Email service using Resend.
"""

import resend
from app.config import settings

resend.api_key = settings.RESEND_API_KEY

async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = None
):
    """Send an email using Resend."""
    try:
        response = resend.Emails.send({
            "from": from_email or settings.FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html
        })
        return response
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

# Email templates
def welcome_email(name: str, email: str):
    """Send welcome email to new user."""
    return send_email(
        to=email,
        subject="Welcome to HireQ! 🎉",
        html=f"""
        <h1>Welcome to HireQ, {name}!</h1>
        <p>Thank you for joining our AI-powered recruitment platform.</p>
        <p>Start by:</p>
        <ul>
            <li>Completing your profile</li>
            <li>Uploading your resume</li>
            <li>Browsing available jobs</li>
        </ul>
        <p>Best of luck in your job search!</p>
        """
    )

def application_status_email(name: str, email: str, job_title: str, status: str):
    """Send application status update email."""
    status_messages = {
        "screening": "Your application is being reviewed",
        "interview": "Congratulations! You've been selected for an interview",
        "offer": "Great news! You have received a job offer",
        "rejected": "Thank you for your interest. Unfortunately, we've decided to move forward with other candidates",
    }
    
    return send_email(
        to=email,
        subject=f"Application Update: {job_title}",
        html=f"""
        <h1>Hi {name},</h1>
        <p>{status_messages.get(status, 'Your application status has been updated.')}</p>
        <p>Position: <strong>{job_title}</strong></p>
        <p>Log in to your HireQ account to view details.</p>
        """
    )

def interview_reminder_email(name: str, email: str, job_title: str, interview_date: str):
    """Send interview reminder email."""
    return send_email(
        to=email,
        subject=f"Interview Reminder: {job_title}",
        html=f"""
        <h1>Interview Reminder</h1>
        <p>Hi {name},</p>
        <p>This is a reminder about your upcoming interview.</p>
        <p><strong>Position:</strong> {job_title}</p>
        <p><strong>Date:</strong> {interview_date}</p>
        <p>Good luck!</p>
        """
    )
```

Add to `backend/requirements.txt`:

```
resend==0.7.0
```

Add to `backend/app/config.py`:

```python
# Email Configuration
RESEND_API_KEY: str = ""
FROM_EMAIL: str = "noreply@yourdomain.com"
```

### Option 2: SendGrid

Similar setup process, use `sendgrid` Python package.

### Option 3: AWS SES

For high volume, AWS SES is cost-effective (~$0.10/1000 emails).

---

## Messaging System

The messaging system is already built into HireQ. Here's how it works:

### Architecture

```
┌─────────────┐         ┌─────────────┐
│  Candidate  │◄───────►│     HR      │
│   Portal    │         │   Portal    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    REST API           │
       ▼                       ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│  ┌─────────────────────────────┐   │
│  │    /api/messages/*          │   │
│  │    - GET /conversations     │   │
│  │    - GET /conversations/:id │   │
│  │    - POST /send             │   │
│  │    - POST /read/:id         │   │
│  └─────────────────────────────┘   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│            MongoDB                  │
│  ┌─────────────┐ ┌────────────────┐│
│  │ Conversations│ │ Direct Messages││
│  └─────────────┘ └────────────────┘│
└─────────────────────────────────────┘
```

### How Messages Flow

1. **Candidate sends message to HR:**
   ```
   POST /api/messages/send
   {
     "receiver_id": "hr_user_id",
     "content": "Hello, I'm interested in the position...",
     "job_id": "job_id" (optional)
   }
   ```

2. **HR receives notification (unread count)**
   ```
   GET /api/messages/unread
   → { "unread_count": 5 }
   ```

3. **HR views conversations**
   ```
   GET /api/messages/conversations
   → List of all conversations with candidates
   ```

4. **HR reads messages**
   ```
   GET /api/messages/conversations/{id}
   → All messages in that conversation
   
   POST /api/messages/read/{id}
   → Marks as read
   ```

5. **HR replies**
   ```
   POST /api/messages/send
   {
     "receiver_id": "candidate_user_id",
     "content": "Thank you for your interest..."
   }
   ```

### Adding Real-time Messaging (WebSocket)

For real-time updates, add WebSocket support:

```python
# backend/app/routes/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
```

### Email Notifications for Messages

Add email notifications when messages are received:

```python
# In messaging.py, after creating a message:
from app.services.email import send_email

# Send email notification
await send_email(
    to=receiver.email,
    subject=f"New message from {current_user.name}",
    html=f"""
    <p>You have a new message from {current_user.name}:</p>
    <blockquote>{message.content[:200]}...</blockquote>
    <p><a href="{settings.FRONTEND_URL}/messages">View in HireQ</a></p>
    """
)
```

---

## AI/ML Services

### Google Gemini (AI Chatbot)

1. Get API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Free tier: 60 requests/minute
3. Add to `.env`: `GEMINI_API_KEY=your-key`

### ML Models (Built-in)

These models are loaded automatically on startup:

| Model | Purpose | Size |
|-------|---------|------|
| `en_core_web_sm` | Resume parsing (NLP) | ~12MB |
| `all-MiniLM-L6-v2` | Job-candidate matching | ~80MB |
| `distilbert-base-uncased-finetuned-sst-2-english` | Sentiment analysis | ~250MB |
| `whisper-base` | Interview transcription | ~74MB |

**Note:** First startup may take 2-3 minutes as models are downloaded.

---

## Security Checklist

Before going to production, ensure:

### Authentication & Authorization
- [ ] Strong JWT secret (64+ characters)
- [ ] JWT tokens expire appropriately (24 hours)
- [ ] Password hashing with bcrypt
- [ ] Role-based access control working

### API Security
- [ ] CORS configured for your domains only
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] File upload size limits

### Database Security
- [ ] MongoDB user has minimal required permissions
- [ ] Network access restricted to server IPs
- [ ] Database backups configured

### Infrastructure
- [ ] HTTPS enabled on all domains
- [ ] Environment variables not in code
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals

### Add Rate Limiting

```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Apply to sensitive routes
@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

1. Create account at [sentry.io](https://sentry.io)
2. Create Python project
3. Add to backend:

```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=settings.ENVIRONMENT
)
```

### Logging Configuration

```python
# backend/app/config.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks

Already implemented at `/api/health`:

```bash
curl https://your-backend.railway.app/api/health
# {"status": "healthy", "database": "connected", "ml_models": "loaded"}
```

---

## Scaling Considerations

### Database
- Enable MongoDB Atlas auto-scaling
- Add read replicas for high traffic
- Use indexes for frequent queries

### Backend
- Use multiple workers: `uvicorn app.main:app --workers 4`
- Add Redis for caching
- Use background tasks for ML processing

### File Storage
- Use CloudFront CDN for S3 files
- Enable S3 Transfer Acceleration

### Frontend
- Vercel automatically scales
- Use ISR (Incremental Static Regeneration) for static pages

---

## Quick Start Commands

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env  # Edit with your values
uvicorn app.main:app --reload

# Frontend (new terminal)
npm install
npm run dev
```

### Production Deployment

```bash
# Backend (Railway)
cd backend
railway init
railway variables set MONGODB_URI="..." JWT_SECRET_KEY="..." FRONTEND_URL="..."
railway up

# Frontend (Vercel)
vercel --prod
```

---

## Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure `FRONTEND_URL` in backend matches your frontend domain exactly
   - Check browser console for specific CORS errors

2. **Database connection fails**
   - Verify MongoDB connection string
   - Check network access settings in Atlas
   - Ensure IP is whitelisted

3. **ML models not loading**
   - Increase memory allocation (Railway: 2GB minimum)
   - Check if spaCy model was downloaded: `python -m spacy download en_core_web_sm`

4. **File uploads failing**
   - Check S3 bucket permissions
   - Verify IAM credentials
   - Check file size limits

5. **Email not sending**
   - Verify Resend API key
   - Check domain verification status
   - Review Resend dashboard for errors

---

## Support

For issues:
1. Check the [GitHub Issues](https://github.com/yourusername/hireq/issues)
2. Review logs in Railway/Render dashboard
3. Check Sentry for error details

---

**Happy Deploying! 🚀**
