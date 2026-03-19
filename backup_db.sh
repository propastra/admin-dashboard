#!/bin/bash
# =============================================
# Propastra Database Backup Script
# Run this BEFORE every `git push` to be safe
# Usage: ./backup_db.sh
# =============================================

DB_PATH="./backend/database.sqlite"
BACKUP_DIR="./backend/db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sqlite"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Copy the database
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    echo "✅ Backup saved: $BACKUP_FILE"
    echo "📦 Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

# Keep only the last 10 backups to save space
cd "$BACKUP_DIR" && ls -t database_backup_*.sqlite | tail -n +11 | xargs rm -f 2>/dev/null
echo "🧹 Old backups cleaned (kept last 10)"
