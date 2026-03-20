#!/usr/bin/env bash
set -euo pipefail

# HireQ — SSL certificate setup script
# Run as root on the DigitalOcean Droplet after Nginx is configured
# and DNS A record for api.hireq.tech is pointing to the Droplet IP.

DOMAIN="api.hireq.tech"
EMAIL="${1:-}"

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <your-email>"
  echo "Example: $0 admin@hireq.tech"
  exit 1
fi

echo "==> Verifying Nginx config..."
nginx -t || { echo "ERROR: Nginx config is invalid. Fix it first."; exit 1; }

echo "==> Checking DNS resolution for ${DOMAIN}..."
RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null || true)
DROPLET_IP=$(curl -sf http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || hostname -I | awk '{print $1}')

if [ "$RESOLVED_IP" != "$DROPLET_IP" ]; then
  echo "WARNING: ${DOMAIN} resolves to ${RESOLVED_IP:-nothing}"
  echo "         but this server's IP is ${DROPLET_IP}"
  echo "         SSL cert issuance may fail. Make sure DNS is propagated."
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

echo "==> Obtaining Let's Encrypt SSL certificate for ${DOMAIN}..."
certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --redirect

echo "==> Testing auto-renewal..."
certbot renew --dry-run

echo ""
echo "============================================"
echo "  SSL setup complete for ${DOMAIN}!"
echo "============================================"
echo ""
echo "Certificate auto-renews via systemd timer."
echo "Verify: certbot renew --dry-run"
echo "Check:  curl https://${DOMAIN}/api/health"
echo ""
