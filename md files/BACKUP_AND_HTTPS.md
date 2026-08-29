# HireQ — Backup & HTTPS Enforcement Strategy

## Database Backup

### MongoDB Atlas (Recommended for Production)
MongoDB Atlas provides automated daily backups with configurable retention.

1. **Enable Continuous Backup** in Atlas: Cluster → Backup → Enable
2. **Retention**: 7-day point-in-time recovery (M10+ clusters)
3. **On-demand snapshots**: Take before deployments or migrations
4. **Restore procedure**:
   ```bash
   # Restore from Atlas snapshot via Atlas UI or CLI
   atlas backups restores start --clusterName HireQ-Prod \
     --snapshotId <snapshot-id> --targetClusterName HireQ-Restore
   ```

### Self-Hosted MongoDB (Docker)
```bash
# Full backup
docker exec hireq-mongodb mongodump --archive=/backup/hireq-$(date +%Y%m%d).gz --gzip

# Restore
docker exec hireq-mongodb mongorestore --archive=/backup/hireq-20260319.gz --gzip
```

**Schedule** via cron: `0 3 * * * /path/to/backup-script.sh` (daily at 3 AM)

---

## HTTPS Enforcement

HTTPS is enforced at the **infrastructure level**, not in the application:

| Deployment | Mechanism |
|---|---|
| **Vercel** | Automatic — all traffic is HTTPS by default |
| **Docker + Traefik** | Traefik's HTTP→HTTPS redirect configured in `docker-compose.prod.yml` |
| **Backend (FastAPI)** | Sets `Strict-Transport-Security` header in production via middleware |
| **Frontend (Next.js)** | Sets `Strict-Transport-Security` header via `next.config.js` and `vercel.json` |

The application does **not** need to handle HTTP→HTTPS redirects itself — the reverse proxy or hosting platform manages this.
