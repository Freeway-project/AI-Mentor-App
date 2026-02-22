#!/bin/bash
# Auto-deploy script: pulls main and rebuilds the API container if there are new commits.
# Run via cron every 30 minutes.

set -euo pipefail

REPO_DIR="/home/ubuntu/AI-Mentor-App"
COMPOSE_FILE="$REPO_DIR/docker/docker-compose.yml"
LOG_FILE="/var/log/owl-auto-deploy.log"
BRANCH="main"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$REPO_DIR"

# Fetch latest without changing working tree
git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  log "No changes on $BRANCH — skipping deploy."
  exit 0
fi

log "New commits detected ($LOCAL → $REMOTE). Deploying..."

# Pull changes
git checkout "$BRANCH"
git pull origin "$BRANCH" >> "$LOG_FILE" 2>&1

# Rebuild API container
log "Building API container..."
docker compose -f "$COMPOSE_FILE" build api --no-cache >> "$LOG_FILE" 2>&1

# Restart container
log "Restarting API container..."
docker compose -f "$COMPOSE_FILE" up -d api >> "$LOG_FILE" 2>&1

log "Deploy complete. Running commit: $(git rev-parse --short HEAD)"
