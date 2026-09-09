CREATE TABLE "vendor_stories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vendorId" VARCHAR NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "coverImageUrl" VARCHAR,
    "videoUrl" VARCHAR,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_stories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_stories_vendorId_key" ON "vendor_stories"("vendorId");
CREATE INDEX "IDX_vendor_stories_vendor_id" ON "vendor_stories"("vendorId");
CREATE INDEX "IDX_vendor_stories_published" ON "vendor_stories"("published");
