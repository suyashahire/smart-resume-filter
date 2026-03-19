#!/usr/bin/env bash
set -euo pipefail

# HireQ — Backend deployment/update script
# Run from the repo root on the DigitalOcean Droplet:
#   /opt/hireq/deploy/deploy-backend.sh

REPO_ROOT="/opt/hireq"
BACKEND_DIR="${REPO_ROOT}/backend"
IMAGE_NAME="hireq-backend"
CONTAINER_NAME="hireq-backend"

echo "==> Pulling latest code..."
cd "$REPO_ROOT"
git pull origin main

echo "==> Building Docker image..."
cd "$BACKEND_DIR"
docker build -t "$IMAGE_NAME" .

echo "==> Stopping old container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "==> Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "${BACKEND_DIR}/.env" \
  -p 127.0.0.1:8000:8000 \
  -v "${BACKEND_DIR}/uploads:/app/uploads" \
  "$IMAGE_NAME"

echo "==> Waiting for health check..."
sleep 10

if curl -sf http://localhost:8000/api/health > /dev/null; then
  echo "==> Backend is healthy!"
else
  echo "==> WARNING: Health check failed. Check logs:"
  echo "    docker logs $CONTAINER_NAME --tail 30"
  exit 1
fi

echo "==> Cleaning up old Docker images..."
docker image prune -f

echo "==> Deployment complete!"
