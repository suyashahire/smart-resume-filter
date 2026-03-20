#!/usr/bin/env bash
set -euo pipefail

# HireQ — MongoDB Atlas backup script
# Add to crontab for automated daily backups:
#   crontab -e
#   0 3 * * * /opt/hireq/deploy/backup-mongodb.sh >> /var/log/hireq-backup.log 2>&1

BACKUP_DIR="/opt/hireq/backups"
RETENTION_DAYS=14
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${DATE}"

if [ ! -f /opt/hireq/backend/.env ]; then
  echo "ERROR: /opt/hireq/backend/.env not found"
  exit 1
fi

MONGODB_URI=$(grep '^MONGODB_URI=' /opt/hireq/backend/.env | cut -d '=' -f 2-)

if [ -z "$MONGODB_URI" ]; then
  echo "ERROR: MONGODB_URI not set in .env"
  exit 1
fi

echo "[$(date)] Starting MongoDB backup..."
mkdir -p "$BACKUP_PATH"

docker run --rm \
  -v "${BACKUP_PATH}:/backup" \
  mongo:7 \
  mongodump --uri="$MONGODB_URI" --out=/backup --gzip

echo "[$(date)] Backup completed: ${BACKUP_PATH}"

echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true

echo "[$(date)] Backup process finished."
