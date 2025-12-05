# Quick Start: Create All Databases

## Step 1: Create the Databases

Open PowerShell and run these commands one by one:

```powershell
# Connect to PostgreSQL (you'll be prompted for password)
psql -U postgres

# Then paste all these CREATE DATABASE commands:
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

# Verify databases were created:
\l

# Exit psql:
\q
```

## Step 2: Update Your .env File

Copy `.env.example` to `.env` if you haven't already:
```powershell
cp .env.example .env
```

Then open `.env` and replace `DB_PASSWORD` with your actual PostgreSQL password in all the database URLs:

```env
AUTH_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_auth_db
PRODUCT_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_product_db
ORDER_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_order_db
PAYMENT_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_payment_db
SHOP_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_shop_db
REVIEW_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_review_db
NOTIFICATION_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_notification_db
ADMIN_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_admin_db
PROMOTION_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_promotion_db
EMAIL_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/crevea_email_db
```

## Step 3: Restart Your Services

Stop all running services (Ctrl+C in terminals) and restart them:

```powershell
# In the root directory
npm run dev

# In a separate terminal for auth service
cd services/auth
npm run dev
```

## Step 4: Verify Connections

Test the auth service:
```powershell
curl http://localhost:3001/health
```

You should see:
```json
{"status":"ok","service":"auth","timestamp":"..."}
```

---

**That's it!** Your microservices now use separate databases for better isolation and scalability.
