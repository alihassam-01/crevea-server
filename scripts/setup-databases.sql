-- PostgreSQL Database Setup Script for Crevea Microservices
-- Run this script as a PostgreSQL superuser (e.g., postgres)

-- Create databases for each microservice
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

-- Optional: Create a dedicated user for the application
-- CREATE USER crevea_user WITH PASSWORD 'your_secure_password';

-- Grant privileges to the user for all databases
-- GRANT ALL PRIVILEGES ON DATABASE crevea_auth_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_product_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_order_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_payment_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_shop_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_review_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_notification_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_admin_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_promotion_db TO crevea_user;
-- GRANT ALL PRIVILEGES ON DATABASE crevea_email_db TO crevea_user;

-- List all databases to verify
\l
