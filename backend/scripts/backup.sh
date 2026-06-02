#!/bin/bash
# Smart Resume Verifier - Database Backup Script

# Config
DB_NAME=${DB_NAME:-postgres}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Run pg_dump
echo "Starting backup of $DB_NAME..."
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
else
  echo "Backup failed!"
  exit 1
fi

# Remove old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Done."
