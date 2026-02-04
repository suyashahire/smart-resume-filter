# 🚀 Deployment Guide
## Smart Resume Filter & AI HR Assistant

**Stack:** DigitalOcean + MongoDB Atlas + Vercel + Namecheap

---

## 📋 What You'll Set Up

| Component | Platform | Cost |
|-----------|----------|------|
| Database | MongoDB Atlas | Free |
| Backend | DigitalOcean | Free ($200 student credit) |
| Frontend | Vercel | Free |
| Domain | Namecheap | Free (.me student offer) |

**Total Cost: $0**

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Repository

```bash
cd /Users/suyash/Downloads/test/main

# Initialize git
git init

# Add all files
git add .

# Create commit
git commit -m "Smart Resume Filter - Ready for deployment"
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `smart-resume-filter`
3. Keep it **Public**
4. Click **Create repository**

### 1.3 Push Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/smart-resume-filter.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas

### 2.1 Create Cluster

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Sign up/Login
2. Create new project: `smart-resume-filter`
3. Click **Build a Database**
4. Select **M0 FREE**
5. Provider: **AWS**, Region: **Mumbai** (or nearest)
6. Cluster name: `Cluster0`
7. Click **Create Cluster**

### 2.2 Create Database User

1. Left sidebar → **SECURITY** → **Database & Network Access**
2. **Database Users** tab → **Add New Database User**
3. Username: `smartresumeapp`
4. Password: Click **Autogenerate Secure Password**
5. **📋 COPY AND SAVE THE PASSWORD!**
6. Privileges: **Read and write to any database**
7. Click **Add User**

### 2.3 Allow Network Access

1. Same page → **Network Access** tab
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere**
4. Click **Confirm**

### 2.4 Get Connection String

1. Left sidebar → **DATABASE** → **Clusters**
2. Click **Connect** on Cluster0
3. Select **Drivers**
4. Copy the connection string:

```
mongodb+srv://smartresumeapp:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

5. Replace `<password>` with your actual password

**Your MongoDB URI:**
```
mongodb+srv://smartresumeapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

---

## Step 3: Deploy Backend to DigitalOcean

### 3.1 Claim Student Credit

1. Go to [education.github.com/pack](https://education.github.com/pack)
2. Find **DigitalOcean** → Claim **$200 credit**
3. Create DigitalOcean account

### 3.2 Create App

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Source: **GitHub**
4. Authorize and select `smart-resume-filter` repository
5. Branch: `main`
6. Click **Next**

### 3.3 Configure App

Edit the auto-detected resource:

| Setting | Value |
|---------|-------|
| **Name** | `smart-resume-api` |
| **Source Directory** | `/backend` |
| **Type** | Web Service |
| **Build Command** | `pip install -r requirements.txt && python -m spacy download en_core_web_sm` |
| **Run Command** | `uvicorn app.main:app --host 0.0.0.0 --port 8080` |
| **HTTP Port** | `8080` |
| **Plan** | Basic ($12/mo) |

### 3.4 Add Environment Variables

Click **Edit** on Environment Variables and add these:

```
PORT=8080
DEBUG=False
ENVIRONMENT=production
MONGODB_URI=mongodb+srv://smartresumeapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
DATABASE_NAME=smart_resume_filter
JWT_SECRET_KEY=paste_generated_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=https://temp.vercel.app
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
MAX_FILE_SIZE_MB=10
```

**Generate JWT_SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3.5 Deploy

1. Click **Next** through remaining steps
2. Click **Create Resources**
3. Wait 5-10 minutes for deployment

### 3.6 Get Backend URL

After deployment completes, your URL will be:
```
https://smart-resume-api-xxxxx.ondigitalocean.app
```

**Test it:** Open `https://YOUR-BACKEND-URL/docs` in browser

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New** → **Project**
3. Select `smart-resume-filter` repository
4. Click **Import**

### 4.2 Configure

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | Leave empty |

### 4.3 Add Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://smart-resume-api-xxxxx.ondigitalocean.app/api` |
| `NEXT_PUBLIC_USE_REAL_API` | `true` |

### 4.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes

### 4.5 Get Frontend URL

Your URL: `https://smart-resume-filter.vercel.app`

---

## Step 5: Connect Everything

### 5.1 Update Backend CORS

Go back to DigitalOcean:
1. App → Settings → Environment Variables
2. Update `FRONTEND_URL`:

```
FRONTEND_URL=https://smart-resume-filter.vercel.app
```

3. Click **Save** → App will redeploy

### 5.2 Test the Application

1. Open `https://smart-resume-filter.vercel.app`
2. Register a new account or login
3. Upload a resume
4. Create a job description
5. Check results

---

## Step 6: Add Custom Domain (Namecheap)

### 6.1 Claim Free Domain

1. Go to [education.github.com/pack](https://education.github.com/pack)
2. Find **Namecheap** → Claim free `.me` domain
3. Register: `smartresumefilter.me` (or your choice)

### 6.2 Add Domain to Vercel

1. Vercel → Your Project → **Settings** → **Domains**
2. Enter: `smartresumefilter.me`
3. Click **Add**
4. Note the DNS records Vercel shows

### 6.3 Configure Namecheap DNS

1. Namecheap → **Domain List** → **Manage**
2. Go to **Advanced DNS** tab
3. Delete existing A/CNAME records
4. Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` | Automatic |
| CNAME | www | `cname.vercel-dns.com` | Automatic |

5. Wait 5-30 minutes for DNS propagation

### 6.4 Add API Subdomain (Optional)

For `api.smartresumefilter.me`:

**In DigitalOcean:**
1. App → Settings → Domains → **Add Domain**
2. Enter: `api.smartresumefilter.me`

**In Namecheap:**
Add this record:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | api | `smart-resume-api-xxxxx.ondigitalocean.app` | Automatic |

### 6.5 Update Environment Variables

**DigitalOcean (Backend):**
```
FRONTEND_URL=https://smartresumefilter.me
```

**Vercel (Frontend):**
```
NEXT_PUBLIC_API_URL=https://api.smartresumefilter.me/api
```
Or if not using api subdomain:
```
NEXT_PUBLIC_API_URL=https://smart-resume-api-xxxxx.ondigitalocean.app/api
```

---

## ✅ Final Checklist

| Step | Status |
|------|--------|
| Code pushed to GitHub | ⬜ |
| MongoDB Atlas cluster created | ⬜ |
| Database user created | ⬜ |
| Network access configured | ⬜ |
| Connection string obtained | ⬜ |
| DigitalOcean app created | ⬜ |
| Backend environment variables set | ⬜ |
| Backend deployed successfully | ⬜ |
| Vercel project created | ⬜ |
| Frontend environment variables set | ⬜ |
| Frontend deployed successfully | ⬜ |
| FRONTEND_URL updated in backend | ⬜ |
| Application tested end-to-end | ⬜ |
| Custom domain configured (optional) | ⬜ |

---

## 🔗 Your URLs

| Service | URL |
|---------|-----|
| Frontend | `https://smartresumefilter.me` |
| Backend API | `https://smart-resume-api-xxxxx.ondigitalocean.app` |
| API Docs | `https://smart-resume-api-xxxxx.ondigitalocean.app/docs` |
| MongoDB | Atlas Dashboard |

---

## 🔧 Quick Troubleshooting

### CORS Error
→ Check `FRONTEND_URL` in DigitalOcean matches your Vercel URL exactly (with https://)

### Database Connection Failed
→ Verify MongoDB URI and password are correct
→ Check Network Access allows 0.0.0.0/0

### Backend Won't Start
→ Check DigitalOcean logs
→ Verify all environment variables are set

### Login Not Working
→ Open browser console (F12) for errors
→ Check `NEXT_PUBLIC_API_URL` is correct

---

## 📊 Monitor Your Credit

DigitalOcean: [cloud.digitalocean.com/account/billing](https://cloud.digitalocean.com/account/billing)

At $12/month, your $200 credit lasts **~16 months**.

---

## 🔐 Environment Variables Reference

### Backend (DigitalOcean)

```env
PORT=8080
DEBUG=False
ENVIRONMENT=production
MONGODB_URI=mongodb+srv://smartresumeapp:PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
DATABASE_NAME=smart_resume_filter
JWT_SECRET_KEY=your-64-character-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=https://smartresumefilter.me
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
MAX_FILE_SIZE_MB=10
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://smart-resume-api-xxxxx.ondigitalocean.app/api
NEXT_PUBLIC_USE_REAL_API=true
```

---

**Project:** Group 40 - Sinhgad Academy of Engineering, Pune  
**Guide:** Prof. Mrs. T. S. Hashmi
