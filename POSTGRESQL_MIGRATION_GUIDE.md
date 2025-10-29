# PostgreSQL Migration Guide

Complete guide for migrating eMarketer Pro from SQLite to PostgreSQL.

## Why PostgreSQL?

The Google Ads integration requires PostgreSQL for:

- **Native Decimal Type**: Accurate financial calculations without floating-point errors
- **Advanced JSON Queries**: Better performance for complex JSON field queries
- **Partitioning**: Time-series metrics tables can be partitioned for better performance
- **Concurrent Connections**: Better handling of multiple MCP server connections
- **Production Ready**: Enterprise-grade reliability and scalability

## Migration Steps

### 1. Backup Current SQLite Database

```bash
# Create backup directory
mkdir -p backups

# Backup SQLite database
cp prisma/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db

# Export data (optional, for verification)
sqlite3 prisma/dev.db .dump > backups/sqlite-dump-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Install PostgreSQL

#### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
psql --version
```

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Follow setup wizard (remember your password!)
4. Add PostgreSQL bin to PATH
5. Verify: Open PowerShell and run `psql --version`

#### Docker (Alternative)
```bash
# Run PostgreSQL in Docker
docker run --name emarketer-postgres \
  -e POSTGRES_USER=emarketer_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=emarketer_pro \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps | grep emarketer-postgres
```

### 3. Create PostgreSQL Database

#### Option A: Using psql
```bash
# Connect to PostgreSQL (default user)
# macOS/Linux:
psql postgres

# Windows:
psql -U postgres

# In psql, run:
CREATE DATABASE emarketer_pro;
CREATE USER emarketer_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE emarketer_pro TO emarketer_user;

# Exit psql
\q
```

#### Option B: Using pgAdmin
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to local server
3. Right-click "Databases" > Create > Database
4. Name: `emarketer_pro`
5. Owner: postgres (or create new user)

#### Option C: Using Database URL directly
If you have a hosted PostgreSQL (e.g., Supabase, Railway, Render):
- Use the provided connection string
- Skip database creation steps

### 4. Update Environment Variables

#### Create or Update `.env`

```env
# OLD (SQLite)
# DATABASE_URL="file:./prisma/dev.db"

# NEW (PostgreSQL - Local)
DATABASE_URL="postgresql://emarketer_user:your_secure_password@localhost:5432/emarketer_pro?schema=public"

# NEW (PostgreSQL - Docker)
DATABASE_URL="postgresql://emarketer_user:secure_password@localhost:5432/emarketer_pro?schema=public"

# NEW (PostgreSQL - Hosted/Production)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

**Important:** Update `your_secure_password` with your actual password!

### 5. Run Prisma Migration

```bash
# Generate Prisma client with new schema
npm run db:generate

# Create and run migration
npm run db:migrate:dev --name init_postgresql

# Or push schema directly (development only)
npm run db:push
```

Expected output:
```
✔ Generated Prisma Client
✔ Successfully migrated database
```

### 6. Migrate Data (Optional)

If you have existing data in SQLite that needs to be migrated:

#### Option A: Manual Migration Script

Create `scripts/migrate-sqlite-to-postgres.ts`:

```typescript
import { PrismaClient as SQLitePrismaClient } from '@prisma/client'
import { PrismaClient as PostgresPrismaClient } from '@prisma/client'

const sqlite = new SQLitePrismaClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
})

const postgres = new PostgresPrismaClient()

async function migrate() {
  console.log('Starting migration...')

  try {
    // Migrate Users
    const users = await sqlite.user.findMany()
    console.log(`Migrating ${users.length} users...`)
    for (const user of users) {
      await postgres.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      })
    }

    // Migrate Companies
    const companies = await sqlite.company.findMany()
    console.log(`Migrating ${companies.length} companies...`)
    for (const company of companies) {
      await postgres.company.upsert({
        where: { id: company.id },
        update: company,
        create: company,
      })
    }

    // Add more models as needed...

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  }
}

migrate()
```

Run the migration:
```bash
npx tsx scripts/migrate-sqlite-to-postgres.ts
```

#### Option B: Using pgloader (Advanced)

```bash
# Install pgloader (macOS)
brew install pgloader

# Create migration config
cat > migrate.load <<EOF
LOAD DATABASE
  FROM sqlite://./prisma/dev.db
  INTO postgresql://emarketer_user:password@localhost/emarketer_pro
  WITH include no drop, create tables, create indexes, reset sequences
  SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# Run migration
pgloader migrate.load
```

### 7. Verify Migration

```bash
# Check database connection
psql "postgresql://emarketer_user:password@localhost:5432/emarketer_pro" -c "\dt"

# Test with Prisma Studio
npm run db:studio

# Run a test query
psql "postgresql://emarketer_user:password@localhost:5432/emarketer_pro" <<EOF
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
```

Expected output: List of all tables including new Google Ads tables.

### 8. Update Application Code

Most code should work without changes, but check for:

#### Decimal Type Handling

**Before (SQLite):**
```typescript
const cost = parseFloat(metric.cost)
```

**After (PostgreSQL):**
```typescript
import { Decimal } from '@prisma/client/runtime/library'

const cost = Number(metric.cost) // Prisma returns Decimal objects
// Or keep as Decimal for precision:
const cost: Decimal = metric.cost
```

#### BigInt Handling

**Before:**
```typescript
const bidMicros = 1000000 // Number
```

**After:**
```typescript
const bidMicros = BigInt(1000000) // BigInt for micros fields
```

#### Date Fields

PostgreSQL has separate Date and DateTime types:
```typescript
// Ensure Date fields use proper Date objects
date: new Date('2024-01-01') // ✓
date: '2024-01-01' // ✗ (might work but not type-safe)
```

### 9. Start Services

```bash
# Start Next.js application
npm run dev

# In another terminal, start MCP servers
npm run mcp:meta
npm run mcp:google-ads
```

Verify everything works:
- Navigate to http://localhost:3000
- Check database connections
- Test integrations

---

## Common Issues & Solutions

### Issue 1: "Can't reach database server"

**Symptoms:**
```
Error: Can't reach database server at `localhost:5432`
```

**Solutions:**
```bash
# Check if PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql

# Start if not running:
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Docker:
docker ps | grep postgres
```

### Issue 2: "Password authentication failed"

**Symptoms:**
```
Error: P1001: password authentication failed for user "emarketer_user"
```

**Solutions:**
1. Verify password in `.env` matches database
2. Check pg_hba.conf (PostgreSQL config):
   ```bash
   # Find pg_hba.conf location
   psql -U postgres -c "SHOW hba_file"
   
   # Edit file (require password authentication)
   # Find line: local all all trust
   # Change to: local all all md5
   
   # Restart PostgreSQL
   brew services restart postgresql@14
   ```

### Issue 3: "Database does not exist"

**Symptoms:**
```
Error: P1003: Database `emarketer_pro` does not exist
```

**Solutions:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE emarketer_pro;"

# Or using createdb utility
createdb -U postgres emarketer_pro
```

### Issue 4: "Migration fails with constraint errors"

**Symptoms:**
```
Error: Foreign key constraint violation
```

**Solutions:**
```bash
# Reset database (DEVELOPMENT ONLY!)
npm run db:push -- --force-reset

# Or manually drop and recreate
psql -U postgres <<EOF
DROP DATABASE IF EXISTS emarketer_pro;
CREATE DATABASE emarketer_pro;
EOF

npm run db:migrate:dev
```

### Issue 5: "Prisma Client outdated"

**Symptoms:**
```
Error: Prisma Client could not locate the Query Engine for runtime "darwin"
```

**Solutions:**
```bash
# Regenerate Prisma Client
npm run db:generate

# If still failing, clear cache
rm -rf node_modules/.prisma
npm run db:generate
```

---

## Performance Optimization

### 1. Connection Pooling

For production, use connection pooling:

```env
# Add to DATABASE_URL
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

Or use PgBouncer:
```bash
# Install PgBouncer
brew install pgbouncer

# Configure for connection pooling
# Edit /usr/local/etc/pgbouncer.ini

# Update DATABASE_URL to use PgBouncer
DATABASE_URL="postgresql://user:password@localhost:6432/emarketer_pro"
```

### 2. Indexes

The schema includes comprehensive indexes. Monitor slow queries:

```sql
-- Enable slow query logging
ALTER DATABASE emarketer_pro SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

### 3. Partitioning (Optional)

For large metrics tables:

```sql
-- Partition GoogleAdsMetricsDaily by date
-- (Run manually in psql)
ALTER TABLE google_ads_metrics_daily 
PARTITION BY RANGE (date);

-- Create partitions for each month
CREATE TABLE google_ads_metrics_daily_2024_01 
PARTITION OF google_ads_metrics_daily
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Repeat for other months...
```

### 4. Vacuuming

Set up automatic maintenance:

```sql
-- Configure autovacuum
ALTER TABLE google_ads_metrics_hourly 
SET (autovacuum_vacuum_scale_factor = 0.05);

ALTER TABLE google_ads_metrics_daily 
SET (autovacuum_vacuum_scale_factor = 0.1);
```

---

## Rollback Plan

If you need to rollback to SQLite:

```bash
# 1. Stop all services
pkill -f "next dev"
pkill -f "mcp"

# 2. Restore SQLite database
cp backups/dev-YYYYMMDD-HHMMSS.db prisma/dev.db

# 3. Update schema.prisma
# Change datasource back to sqlite

# 4. Update .env
# DATABASE_URL="file:./prisma/dev.db"

# 5. Regenerate Prisma Client
npm run db:generate

# 6. Restart services
npm run dev
```

---

## Production Deployment

### Recommended Providers

**Managed PostgreSQL:**
- [Supabase](https://supabase.com/) - Free tier available, excellent for development
- [Railway](https://railway.app/) - Easy setup, good for small to medium apps
- [Render](https://render.com/) - Auto-scaling, good pricing
- [AWS RDS](https://aws.amazon.com/rds/) - Enterprise-grade, full control
- [Google Cloud SQL](https://cloud.google.com/sql) - Integrated with Google services

### Production Checklist

- [ ] Use strong passwords
- [ ] Enable SSL/TLS (`?sslmode=require`)
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable monitoring and alerts
- [ ] Set up read replicas (if needed)
- [ ] Configure firewall rules
- [ ] Use environment-specific credentials
- [ ] Test disaster recovery plan
- [ ] Document access procedures

---

## Monitoring & Maintenance

### Daily Checks
```bash
# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('emarketer_pro'));"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql $DATABASE_URL -c "SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state = 'active' ORDER BY query_start;"
```

### Weekly Maintenance
```bash
# Vacuum and analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Reindex if needed
psql $DATABASE_URL -c "REINDEX DATABASE emarketer_pro;"
```

### Backup Strategy
```bash
# Create backup script
cat > scripts/backup-postgres.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups"
BACKUP_FILE="$BACKUP_DIR/postgres-$DATE.dump"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL -Fc -f $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "postgres-*.dump" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x scripts/backup-postgres.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
# 0 2 * * * /path/to/scripts/backup-postgres.sh
```

---

## Next Steps

After successful migration:

1. ✅ Follow [GOOGLE_ADS_SETUP.md](./GOOGLE_ADS_SETUP.md) to complete Google Ads integration
2. ✅ Test all integrations (Google Ads, Meta, GA4)
3. ✅ Run sync operations and verify data
4. ✅ Monitor performance and optimize queries
5. ✅ Set up production deployment

---

## Support

If you encounter issues not covered in this guide:

1. Check PostgreSQL logs:
   ```bash
   # macOS
   tail -f /usr/local/var/log/postgresql@14.log
   
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

2. Check Prisma logs:
   ```bash
   # Enable debug mode
   DEBUG="prisma:*" npm run dev
   ```

3. Consult documentation:
   - [PostgreSQL Documentation](https://www.postgresql.org/docs/14/)
   - [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
   - [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Congratulations!** Your database is now running on PostgreSQL with full Google Ads integration support! 🎉



