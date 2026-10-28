#!/usr/bin/env bash
# Nightly pg_dump of the WaffleWalks database, keeping 14 days.
# Install in the ubuntu user's crontab: 40 2 * * * /home/ubuntu/waffle-walks/server/backup.sh >> /home/ubuntu/waffle-walks-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
DIR=/var/backups/waffle-walks
KEEP_DAYS=14
URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)
umask 077
mkdir -p "$DIR"
STAMP=$(date +%Y-%m-%d_%H%M)
pg_dump --format=custom --no-owner "$URL" > "$DIR/wafflewalks_$STAMP.dump"
find "$DIR" -name 'wafflewalks_*.dump' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup ok: $DIR/wafflewalks_$STAMP.dump ($(du -h "$DIR/wafflewalks_$STAMP.dump" | cut -f1))"
