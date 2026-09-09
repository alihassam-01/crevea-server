-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "token" VARCHAR NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" VARCHAR NOT NULL,
    "variationId" VARCHAR,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "restockDate" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_82aa5da437c5bbfb80703b08309" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "provider" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "email" VARCHAR,
    "profile" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" VARCHAR NOT NULL,
    "productId" VARCHAR NOT NULL,
    "shopId" VARCHAR NOT NULL,
    "productName" VARCHAR NOT NULL,
    "productImage" VARCHAR,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "variation" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderNumber" VARCHAR NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "shippingAddress" JSONB NOT NULL,
    "trackingNumber" VARCHAR,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "token" VARCHAR NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" VARCHAR NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "method" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "gatewayTransactionId" VARCHAR,
    "gatewayResponse" JSONB,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shopId" VARCHAR NOT NULL,
    "requestedAmount" DECIMAL(10,2) NOT NULL,
    "approvedAmount" DECIMAL(10,2),
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "paymentMethod" VARCHAR NOT NULL,
    "paymentDetails" JSONB NOT NULL,
    "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(6),
    "completedAt" TIMESTAMP(6),
    "approvedBy" VARCHAR,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "product_variations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "sku" VARCHAR,
    "priceAdjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_353249b2d301e047dde9ef0487c" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shopId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "description" TEXT,
    "shortDescription" VARCHAR(500),
    "type" VARCHAR NOT NULL DEFAULT 'PHYSICAL',
    "status" VARCHAR NOT NULL DEFAULT 'DRAFT',
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "sku" VARCHAR(100),
    "weight" INTEGER,
    "dimensions" JSONB,
    "attributes" JSONB DEFAULT '{}',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sizeChartId" VARCHAR,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "return_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" VARCHAR NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_38714de8942bd9bc3a450a06889" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" VARCHAR NOT NULL,
    "targetId" VARCHAR NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "orderId" VARCHAR,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "comment" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR NOT NULL DEFAULT 'PENDING',
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "sellerResponse" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "seller_earnings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shopId" VARCHAR NOT NULL,
    "orderId" VARCHAR NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_e244c4595c57cfd515a97591146" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "refreshToken" VARCHAR NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "ipAddress" VARCHAR,
    "userAgent" VARCHAR,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" VARCHAR NOT NULL,
    "sellerId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "logo" VARCHAR,
    "banner" VARCHAR,
    "category" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" VARCHAR NOT NULL DEFAULT 'PENDING',
    "address" JSONB,
    "phone" VARCHAR,
    "email" VARCHAR,
    "socialLinks" JSONB,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "verificationDocuments" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "size_charts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shopId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "imageUrl" VARCHAR NOT NULL,
    "category" VARCHAR,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_9a856588006e41aafef85dee028" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR NOT NULL,
    "passwordHash" VARCHAR NOT NULL,
    "firstName" VARCHAR NOT NULL,
    "lastName" VARCHAR NOT NULL,
    "phone" VARCHAR,
    "avatar" VARCHAR,
    "role" VARCHAR NOT NULL DEFAULT 'CUSTOMER',
    "status" VARCHAR NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" VARCHAR,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(6),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "UQ_3d1613f95c6a564a3b588d161ae" ON "email_verification_tokens"("token");
-- CreateIndex
CREATE INDEX "IDX_10f285d038feb767bf7c2da14b" ON "email_verification_tokens"("userId");
-- CreateIndex
CREATE INDEX "IDX_3d1613f95c6a564a3b588d161a" ON "email_verification_tokens"("token");
-- CreateIndex
CREATE INDEX "IDX_c8622e1e24c6d054d36e882449" ON "inventory"("productId");
-- CreateIndex
CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications"("userId");
-- CreateIndex
CREATE INDEX "IDX_f8b7ed75170d2d7dca4477cc94" ON "notifications"("read");
-- CreateIndex
CREATE INDEX "IDX_4c22f13249ce02f89dc6d226e9" ON "oauth_accounts"("userId");
-- CreateIndex
CREATE INDEX "IDX_bb75785331270a8da0860e915a" ON "oauth_accounts"("providerId");
-- CreateIndex
CREATE INDEX "IDX_25469b09ff158a602cf0b23441" ON "order_items"("shopId");
-- CreateIndex
CREATE INDEX "IDX_cdb99c05982d5191ac8465ac01" ON "order_items"("productId");
-- CreateIndex
CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items"("orderId");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_59b0c3b34ea0fa5562342f24143" ON "orders"("orderNumber");
-- CreateIndex
CREATE INDEX "IDX_59b0c3b34ea0fa5562342f2414" ON "orders"("orderNumber");
-- CreateIndex
CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders"("status");
-- CreateIndex
CREATE INDEX "IDX_e5de51ca888d8b1f5ac25799dd" ON "orders"("customerId");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_ab673f0e63eac966762155508ee" ON "password_reset_tokens"("token");
-- CreateIndex
CREATE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens"("token");
-- CreateIndex
CREATE INDEX "IDX_d6a19d4b4f6c62dcd29daa497e" ON "password_reset_tokens"("userId");
-- CreateIndex
CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments"("status");
-- CreateIndex
CREATE INDEX "IDX_824be6feda5e655c49c4e0c534" ON "payments"("customerId");
-- CreateIndex
CREATE INDEX "IDX_af929a5f2a400fdb6913b4967e" ON "payments"("orderId");
-- CreateIndex
CREATE INDEX "IDX_00bee286e10503ef93d9bc4a25" ON "payouts"("shopId");
-- CreateIndex
CREATE INDEX "IDX_3f32ee6d2385d9a8bc0cc92af5" ON "payouts"("status");
-- CreateIndex
CREATE INDEX "IDX_a5bbc1e7886ded70ebf6a7c6f7" ON "product_variations"("productId");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_464f927ae360106b783ed0b4106" ON "products"("slug");
-- CreateIndex
CREATE INDEX "IDX_1846199852a695713b1f8f5e9a" ON "products"("status");
-- CreateIndex
CREATE INDEX "IDX_464f927ae360106b783ed0b410" ON "products"("slug");
-- CreateIndex
CREATE INDEX "IDX_51a281693ebef6fa8729de3938" ON "products"("shopId");
-- CreateIndex
CREATE INDEX "IDX_c3932231d2385ac248d0888d95" ON "products"("category");
-- CreateIndex
CREATE INDEX "IDX_01853126105daa52caee638ab8" ON "return_requests"("orderId");
-- CreateIndex
CREATE INDEX "IDX_dd314a4387a9e587093c3f5d9c" ON "return_requests"("customerId");
-- CreateIndex
CREATE INDEX "IDX_4a73980338b57f2c9178d8aaeb" ON "reviews"("targetId");
-- CreateIndex
CREATE INDEX "IDX_6d99bdfa69280ede313699fab9" ON "reviews"("customerId");
-- CreateIndex
CREATE INDEX "IDX_7b06c23cf52ca8aea0dcaf0ee2" ON "reviews"("status");
-- CreateIndex
CREATE INDEX "IDX_41ef7cc9fc33b95bb9080178ef" ON "seller_earnings"("shopId");
-- CreateIndex
CREATE INDEX "IDX_eab30f04026be0499f77bba4ee" ON "seller_earnings"("status");
-- CreateIndex
CREATE INDEX "IDX_f1c3271a513dc103b5dd8d1a4f" ON "seller_earnings"("orderId");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_b443618a8149644123d48eceed4" ON "sessions"("refreshToken");
-- CreateIndex
CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions"("userId");
-- CreateIndex
CREATE INDEX "IDX_b443618a8149644123d48eceed" ON "sessions"("refreshToken");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_8c28ec876676eeb1dcb65c01b7f" ON "shops"("slug");
-- CreateIndex
CREATE INDEX "IDX_2b127fe6841559e3a9140669d6" ON "shops"("status");
-- CreateIndex
CREATE INDEX "IDX_893505f2f0b2e20518c37c7363" ON "shops"("category");
-- CreateIndex
CREATE INDEX "IDX_8c28ec876676eeb1dcb65c01b7" ON "shops"("slug");
-- CreateIndex
CREATE INDEX "IDX_94194bc87b70e0b20bf4d1709c" ON "shops"("sellerId");
-- CreateIndex
CREATE INDEX "IDX_f50021088dc5fde0ca60f96d1e" ON "shops"("verificationStatus");
-- CreateIndex
CREATE INDEX "IDX_9524ef79037cdee39f5f8e8072" ON "size_charts"("shopId");
-- CreateIndex
CREATE UNIQUE INDEX "UQ_97672ac88f789774dd47f7c8be3" ON "users"("email");
-- CreateIndex
CREATE INDEX "IDX_3676155292d72c67cd4e090514" ON "users"("status");
-- CreateIndex
CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"("email");
-- CreateIndex
CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users"("role");
