# PowerShell Script to Create PostgreSQL Databases for Crevea Microservices
# Make sure PostgreSQL is installed and psql is in your PATH

param(
    [string]$PostgresUser = "postgres",
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432
)

Write-Host "Creating databases for Crevea microservices..." -ForegroundColor Green

$databases = @(
    "crevea_auth_db",
    "crevea_product_db",
    "crevea_order_db",
    "crevea_payment_db",
    "crevea_shop_db",
    "crevea_review_db",
    "crevea_notification_db",
    "crevea_admin_db",
    "crevea_promotion_db",
    "crevea_email_db"
)

foreach ($db in $databases) {
    Write-Host "Creating database: $db" -ForegroundColor Cyan
    
    # Check if database exists
    $checkDb = "SELECT 1 FROM pg_database WHERE datname='$db'"
    $exists = psql -U $PostgresUser -h $PostgresHost -p $PostgresPort -tAc $checkDb 2>$null
    
    if ($exists -eq "1") {
        Write-Host "  Database $db already exists, skipping..." -ForegroundColor Yellow
    } else {
        # Create database
        $createDb = "CREATE DATABASE $db"
        psql -U $PostgresUser -h $PostgresHost -p $PostgresPort -c $createDb
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Successfully created $db" -ForegroundColor Green
        } else {
            Write-Host "  Failed to create $db" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "Remember to update your .env file with the new database URLs" -ForegroundColor Yellow
