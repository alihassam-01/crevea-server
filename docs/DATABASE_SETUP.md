# Database Setup Guide for Crevea Microservices

This guide will help you set up separate PostgreSQL databases for each microservice in the Crevea platform.

## Why Separate Databases?

- **Service Independence**: Each service can be deployed and scaled independently
- **Data Isolation**: Database failures won't cascade across services
- **Clear Boundaries**: Enforces proper microservice architecture
- **Easier Scaling**: Scale databases based on individual service needs

## Prerequisites

- PostgreSQL installed and running
- PostgreSQL user with database creation privileges (default: `postgres`)
- `psql` command-line tool available in your PATH

## Quick Setup (Recommended)

### Option 1: Using PowerShell Script (Windows)

```powershell
# Navigate to the project root
cd d:\Crevea\crevea-server

# Run the setup script
.\scripts\setup-databases.ps1

# If you get execution policy errors, run:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-databases.ps1
```

### Option 2: Using SQL Script

```powershell
# Navigate to the project root
cd d:\Crevea\crevea-server

# Run the SQL script
psql -U postgres -f scripts\setup-databases.sql
```

### Option 3: Manual Creation

```powershell
# Connect to PostgreSQL
psql -U postgres

# Then run these commands:
CREATE DATABASE crevea_auth_db;
CREATE DATABASE crevea_product_db;
CREATE DATABASE crevea_order_db;
CREATE DATABASE crevea_payment_db;
CREATE DATABASE crevea_shop_db;
CREATE DATABASE crevea_review_db;
CREATE DATABASE crevea_notification_db;
CREATE DATABASE crevea_admin_db;
CREATE DATABASE crevea_promotion_db;
CREATE DATABASE crevea_email_db;

# List databases to verify
\l

# Exit
\q
```

## Database Mapping

| Service | Database Name | Purpose |
|---------|---------------|---------|
| Auth | `crevea_auth_db` | Users, sessions, OAuth accounts |
| Product | `crevea_product_db` | Products, categories, inventory |
| Order | `crevea_order_db` | Orders, order items |
| Payment | `crevea_payment_db` | Payments, transactions |
| Shop | `crevea_shop_db` | Shops, shop settings |
| Review | `crevea_review_db` | Reviews, ratings |
| Notification | `crevea_notification_db` | Notifications, templates |
| Admin | `crevea_admin_db` | Admin logs, settings |
| Promotion | `crevea_promotion_db` | Promotions, coupons |
| Email | `crevea_email_db` | Email logs, templates |

## Environment Configuration

After creating the databases, update your `.env` file:

1. Copy `.env.example` to `.env` if you haven't already:
   ```powershell
   cp .env.example .env
   ```

2. Update the database URLs in `.env` with your actual password:
   ```env
   AUTH_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/crevea_auth_db
   PRODUCT_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/crevea_product_db
   # ... and so on for all services
   ```

3. Replace `DB_PASSWORD` with your actual PostgreSQL password

## Service-Specific Configuration

Each service's `database.ts` file should use the appropriate environment variable:

- **Auth Service**: Uses `AUTH_DATABASE_URL` or `DATABASE_URL`
- **Product Service**: Uses `PRODUCT_DATABASE_URL` or `DATABASE_URL`
- **Order Service**: Uses `ORDER_DATABASE_URL` or `DATABASE_URL`
- And so on...

## Verification

After setup, verify the databases were created:

```powershell
psql -U postgres -c "\l" | findstr crevea
```

You should see all 10 databases listed.

## Troubleshooting

### Connection Refused Error

If you get `ECONNREFUSED` errors:
1. Ensure PostgreSQL is running
2. Check your database password in `.env`
3. Verify the database exists: `psql -U postgres -l`

### Authentication Failed

If you get authentication errors:
1. Check your PostgreSQL password
2. Update `pg_hba.conf` to allow local connections
3. Restart PostgreSQL service

### Database Already Exists

If databases already exist, you can:
- Drop and recreate: `DROP DATABASE crevea_auth_db; CREATE DATABASE crevea_auth_db;`
- Or skip creation and just update your `.env` file

## Next Steps

1. ✅ Create all databases
2. ✅ Update `.env` file with correct passwords
3. ⏳ Update each service's `database.ts` to use service-specific DATABASE_URL
4. ⏳ Restart all services
5. ⏳ Verify connections with health checks

## Migration Strategy

If you're migrating from a single database:

1. **Backup existing data**: `pg_dump crevea_server > backup.sql`
2. **Create new databases** (using scripts above)
3. **Migrate data** to appropriate databases based on table ownership
4. **Update service configurations**
5. **Test thoroughly** before dropping old database

## Production Considerations

For production environments:
- Use separate PostgreSQL instances for critical services
- Implement database replication for high availability
- Set up automated backups for each database
- Use connection pooling (already configured in TypeORM)
- Monitor database performance separately per service
