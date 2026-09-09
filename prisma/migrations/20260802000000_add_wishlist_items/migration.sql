CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" VARCHAR NOT NULL,
    "productId" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_wishlist_items_user_product" ON "wishlist_items"("userId", "productId");
CREATE INDEX "IDX_wishlist_items_user_id" ON "wishlist_items"("userId");
CREATE INDEX "IDX_wishlist_items_product_id" ON "wishlist_items"("productId");
