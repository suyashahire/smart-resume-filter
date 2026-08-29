# HireQ Production Deployment Guide

Complete guide to deploy HireQ using free resources from the GitHub Student Developer Pack.

## Architecture

```
User Browser
  ├── https://hireq.tech  ──────> Vercel (Next.js Frontend)
  └── wss://api.hireq.tech ────> DigitalOcean Droplet (FastAPI Backend)
                                    ├── MongoDB Atlas (Free M0)
                                    ├── Google Gemini API (Free)
                                    └── Resend Email API (Free)
```

## Cost Breakdown

| Service | Plan | Cost | Source |
|---------|------|------|--------|
| Domain (hireq.tech) | 1 year free | $0 | GitHub Student Pack — .tech domains |
| SSL Certificate | Let's Encrypt (auto-renewing) | $0 | Free / Namecheap Student Pack |
| Backend Server | DigitalOcean 4GB/2vCPU ($24/mo) | $0 for ~8 months | GitHub Student Pack — $200 credits |
| Frontend Hosting | Vercel Hobby | $0 | Free tier |
| Database | MongoDB Atlas M0 | $0 | Free tier (512MB) |
| Email | Resend Free | $0 | 3,000 emails/month |
| AI Chatbot | Google Gemini Free | $0 | Free API key |
| **Total** | | **$0** | |

---

## Phase 1: Domain and DNS Setup

### 1.1 — Claim hireq.tech

1. Go to https://education.github.com/pack
2. Search for ".tech" in the partner list
3. Click "Get access" on the .tech domains offer
4. Register `hireq.tech` (free for 1 year)
5. Complete checkout ($0)

### 1.2 — Namecheap SSL Certificate (Optional)

1. Go to https://education.github.com/pack
2. Search for "Namecheap" and claim the SSL certificate offer (1-year free PositiveSSL)
3. You will install this on the DigitalOcean backend after the Droplet is set up

**Alternative (recommended):** Use Let's Encrypt via Certbot — free, auto-renewing, easier setup. This guide uses Let's Encrypt by default.

### 1.3 — DNS Records

Set these up in your .tech domain registrar panel after creating the Droplet and Vercel project:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` (Vercel) | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |
| A | api | `<DROPLET_IP>` | 3600 |

Email DNS records (added in Phase 5 after Resend setup):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | resend._domainkey | *(from Resend dashboard)* | 3600 |
| TXT | @ | `v=spf1 include:amazonses.com ~all` | 3600 |
| MX | send | `feedback-smtp.us-east-1.amazonses.com` | 3600 |

---

## Phase 2: MongoDB Atlas Setup (Free Tier)

### 2.1 — Create Cluster

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a project named "HireQ"
3. Click "Build a Database" → select **M0 FREE**
4. Region: AWS us-east-1 (closest to DigitalOcean NYC1)
5. Cluster name: `hireq-cluster`

### 2.2 — Configure Access

1. **Database User**:
   - Username: `hireq_app`
   - Password: generate a strong random password — save it
   - Role: "Read and write to any database"

2. **Network Access**:
   - Temporarily add `0.0.0.0/0` for initial setup
   - After deployment, restrict to only `<DROPLET_IP>/32`

3. **Connection String**:
   - Click "Connect" → "Drivers" → Python
   - Copy: `mongodb+srv://hireq_app:<password>@hireq-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## Phase 3: DigitalOcean Backend Deployment

### 3.1 — Claim Credits

1. Go to https://education.github.com/pack
2. Claim the DigitalOcean offer ($200 credit, 12 months)
3. Verify credits in Billing dashboard

### 3.2 — Create Droplet

1. Dashboard → Create → Droplets
2. Region: NYC1 (close to Atlas us-east-1)
3. Image: Ubuntu 24.04 LTS
4. Size: **4 GB RAM / 2 vCPU / 80 GB SSD** ($24/mo)
5. Authentication: SSH Key (recommended)
6. Hostname: `hireq-backend`
7. Note the Droplet IP address

### 3.3 — Server Setup

SSH in and run the automated setup script:

```bash
ssh root@<DROPLET_IP>

# Download and run setup script
curl -sSL https://raw.githubusercontent.com/<your-username>/hireq/main/deploy/setup-server.sh | bash
```

Or manually:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Install Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create app user
adduser --disabled-password --gecos "" hireq
usermod -aG docker hireq
mkdir -p /opt/hireq
chown hireq:hireq /opt/hireq

# Enable Docker on boot
systemctl enable docker
```

### 3.4 — Deploy Backend

```bash
su - hireq
cd /opt/hireq
git clone https://github.com/<your-username>/hireq.git .
```

Create `/opt/hireq/backend/.env` (use the template from `backend/.env.production`):

```bash
cp backend/.env.production backend/.env
nano backend/.env   # Fill in your actual values
```

Generate JWT secret:

```bash
openssl rand -hex 64
```

Build and run:

```bash
cd /opt/hireq/backend
docker build -t hireq-backend .
docker run -d \
  --name hireq-backend \
  --restart unless-stopped \
  --env-file .env \
  -p 127.0.0.1:8000:8000 \
  -v /opt/hireq/backend/uploads:/app/uploads \
  hireq-backend
```

Verify:

```bash
docker logs hireq-backend --tail 20
curl http://localhost:8000/api/health
```

### 3.5 — Nginx + SSL

Copy the nginx config:

```bash
# As root
cp /opt/hireq/deploy/nginx/hireq-api.conf /etc/nginx/sites-available/hireq-api
ln -sf /etc/nginx/sites-available/hireq-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Get SSL certificate (after DNS is pointing to the Droplet):

```bash
certbot --nginx -d api.hireq.tech --non-interactive --agree-tos -m <your-email>
```

Verify auto-renewal:

```bash
certbot renew --dry-run
```

### 3.6 — Verify Backend

```bash
curl https://api.hireq.tech/api/health
# Expected: {"status":"healthy","database":"connected"}
```

---

## Phase 4: Vercel Frontend Deployment

### 4.1 — Deploy

1. Go to https://vercel.com and sign in with GitHub
2. "Add New" → "Project" → Import your repository
3. Framework Preset: Next.js (auto-detected)
4. Root Directory: `.`
5. Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.hireq.tech/api` |
| `NEXT_PUBLIC_APP_URL` | `https://hireq.tech` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.hireq.tech/api/realtime` |
| `NEXT_PUBLIC_API_HOST` | `api.hireq.tech` |

6. Click "Deploy"

### 4.2 — Custom Domain

1. Settings → Domains → Add `hireq.tech` and `www.hireq.tech`
2. Add the DNS records Vercel shows (A record for @, CNAME for www)
3. Vercel provisions SSL automatically

### 4.3 — Verify

- Visit https://hireq.tech
- Check landing page, login, registration all work
- Browser console shows no CORS errors

---

## Phase 5: Email Setup (Resend)

### 5.1 — Create Account

1. Sign up at https://resend.com (free: 3,000 emails/month)
2. Domains → Add Domain → enter `hireq.tech`

### 5.2 — DNS Records

Add the records Resend shows in your .tech domain DNS panel:
- DKIM (TXT record)
- SPF (TXT record)
- Return Path (MX/CNAME)

Click "Verify" after DNS propagation.

### 5.3 — API Key

1. API Keys → Create API Key → "HireQ Production"
2. Copy the key (`re_xxxxxxxx`)
3. Add to backend `.env`: `RESEND_API_KEY=re_xxxxxxxx`
4. Set `FROM_EMAIL=noreply@hireq.tech`
5. Restart: `docker restart hireq-backend`

---

## Phase 6: Google Gemini API Key (Free)

1. Go to https://aistudio.google.com/apikey
2. Create API Key
3. Add to backend `.env`: `GEMINI_API_KEY=AIzaSy...`
4. Restart: `docker restart hireq-backend`

Free tier: 15 RPM for Gemini 2.0 Flash, 30 RPM for Flash Lite.

---

## Phase 7: Post-Deployment Checklist

### Backend
- [ ] `curl https://api.hireq.tech/api/health` returns `{"status":"healthy"}`

### Frontend
- [ ] https://hireq.tech loads the landing page
- [ ] All sections render correctly
- [ ] Recruiter Portal link → `/login`
- [ ] Candidate Portal link → `/candidate/login`

### Auth
- [ ] HR registration and login work
- [ ] Candidate registration and login work
- [ ] Logout clears session

### Features
- [ ] Resume upload works
- [ ] Job creation works
- [ ] Screening produces results
- [ ] Candidate can apply to jobs
- [ ] AI Chatbot responds
- [ ] Messaging works
- [ ] Interview analysis works
- [ ] PDF report generation works

### Email
- [ ] Welcome email sent on registration
- [ ] Status change email sent
- [ ] Check deliverability at https://www.mail-tester.com

### Security
- [ ] https://hireq.tech has valid SSL
- [ ] https://api.hireq.tech has valid SSL
- [ ] http:// redirects to https://
- [ ] Check headers at https://securityheaders.com

---

## Phase 8: Maintenance

### View Logs
```bash
docker logs -f hireq-backend
docker stats hireq-backend
```

### Update Backend
```bash
ssh root@<DROPLET_IP>
cd /opt/hireq && git pull origin main
cd backend && docker build -t hireq-backend .
docker stop hireq-backend && docker rm hireq-backend
docker run -d --name hireq-backend --restart unless-stopped \
  --env-file .env -p 127.0.0.1:8000:8000 \
  -v /opt/hireq/backend/uploads:/app/uploads hireq-backend
```

Or use the deploy script:
```bash
/opt/hireq/deploy/deploy-backend.sh
```

### Update Frontend
Push to main branch — Vercel auto-deploys.

### MongoDB Backup
```bash
# Manual backup
mongodump --uri="<ATLAS_URI>" --out=/opt/hireq/backups/$(date +%Y%m%d) --gzip
```

### SSL Renewal
Let's Encrypt auto-renews via systemd timer. Verify:
```bash
certbot renew --dry-run
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | `docker logs hireq-backend` — likely ML model load failure. `docker restart hireq-backend` |
| MongoDB timeout | Check Atlas Network Access whitelist includes Droplet IP |
| CORS errors | Verify `FRONTEND_URL=https://hireq.tech` in `.env` (no trailing slash) |
| WebSocket fails | Check Nginx config has `Upgrade` and `Connection` headers |
| Email not sending | Verify Resend domain is verified. Check `RESEND_API_KEY` in `.env` |
| Slow first request | Normal — ML models load at startup (30-60s). Subsequent requests are fast |
| Atlas 512MB full | Clean old screening results or upgrade to M2 ($9/mo) |

---

## Quick Reference

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| .tech Domain | get.tech | DNS management |
| DigitalOcean | cloud.digitalocean.com | Backend server |
| Vercel | vercel.com/dashboard | Frontend hosting |
| MongoDB Atlas | cloud.mongodb.com | Database |
| Resend | resend.com/dashboard | Email service |
| Google AI Studio | aistudio.google.com | Gemini API key |
| GitHub Education | github.com/settings/education | Student Pack status |
