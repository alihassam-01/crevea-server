-- Persist vendor/customer conversations and executive-managed legal content.
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "senderId" VARCHAR NOT NULL,
    "recipientId" VARCHAR NOT NULL,
    "orderId" VARCHAR,
    "shopId" VARCHAR,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_pages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");
CREATE INDEX "messages_recipientId_idx" ON "messages"("recipientId");
CREATE INDEX "messages_orderId_idx" ON "messages"("orderId");
CREATE INDEX "messages_shopId_idx" ON "messages"("shopId");
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");
CREATE UNIQUE INDEX "content_pages_key_key" ON "content_pages"("key");
CREATE INDEX "content_pages_key_idx" ON "content_pages"("key");
CREATE INDEX "content_pages_published_idx" ON "content_pages"("published");
