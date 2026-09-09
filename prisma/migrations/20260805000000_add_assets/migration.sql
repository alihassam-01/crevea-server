CREATE TABLE "assets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "environment" VARCHAR(16) NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "entityId" VARCHAR NOT NULL,
    "assetType" VARCHAR(32) NOT NULL,
    "assetId" UUID NOT NULL,
    "variant" VARCHAR(32) NOT NULL,
    "objectKey" VARCHAR NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "mimeType" VARCHAR(64) NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_assets" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_assets_object_key" ON "assets"("objectKey");
CREATE UNIQUE INDEX "UQ_assets_dedup" ON "assets"("domain", "entityId", "assetType", "contentHash", "variant");
CREATE INDEX "IDX_assets_entity" ON "assets"("domain", "entityId", "assetType");
CREATE INDEX "IDX_assets_asset_id" ON "assets"("assetId");
