#!/usr/bin/env bash
set -euo pipefail

# HireQ — DigitalOcean Droplet initial setup script
# Run as root on a fresh Ubuntu 24.04 LTS droplet:
#   bash setup-server.sh

echo "==> Updating system packages..."
apt update && apt upgrade -y

echo "==> Installing Docker..."
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

echo "==> Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Creating application user 'hireq'..."
if ! id -u hireq &>/dev/null; then
  adduser --disabled-password --gecos "" hireq
fi
usermod -aG docker hireq

echo "==> Creating application directory..."
mkdir -p /opt/hireq
chown hireq:hireq /opt/hireq

echo "==> Enabling Docker on boot..."
systemctl enable docker

echo "==> Creating backup directory..."
mkdir -p /opt/hireq/backups
chown hireq:hireq /opt/hireq/backups

echo ""
echo "============================================"
echo "  Server setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. su - hireq"
echo "  2. cd /opt/hireq"
echo "  3. git clone <your-repo-url> ."
echo "  4. cp backend/.env.production backend/.env"
echo "  5. nano backend/.env  (fill in secrets)"
echo "  6. cd backend && docker build -t hireq-backend ."
echo "  7. docker run -d --name hireq-backend --restart unless-stopped \\"
echo "       --env-file .env -p 127.0.0.1:8000:8000 \\"
echo "       -v /opt/hireq/backend/uploads:/app/uploads hireq-backend"
echo ""
