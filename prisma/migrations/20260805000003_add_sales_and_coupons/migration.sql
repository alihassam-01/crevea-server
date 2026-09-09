ALTER TABLE "shops" ADD COLUMN "salePercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "shops" ADD COLUMN "saleStartsAt" TIMESTAMP(6);
ALTER TABLE "shops" ADD COLUMN "saleEndsAt" TIMESTAMP(6);
ALTER TABLE "products" ADD COLUMN "salePercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "saleStartsAt" TIMESTAMP(6);
ALTER TABLE "products" ADD COLUMN "saleEndsAt" TIMESTAMP(6);
CREATE TABLE "coupons" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(), "shopId" VARCHAR NOT NULL, "sellerId" VARCHAR NOT NULL,
  "code" VARCHAR(50) NOT NULL, "discountType" VARCHAR(16) NOT NULL, "discountValue" DECIMAL(10,2) NOT NULL,
  "minPurchaseAmount" DECIMAL(10,2) NOT NULL DEFAULT 0, "maxDiscountAmount" DECIMAL(10,2), "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0, "startsAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(6) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_coupons" PRIMARY KEY ("id"), CONSTRAINT "UQ_coupons_code" UNIQUE ("code")
);
CREATE INDEX "IDX_coupons_shop" ON "coupons" ("shopId");
CREATE INDEX "IDX_coupons_seller" ON "coupons" ("sellerId");
