-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrossSellRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceProductTitle" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "recommendedProductTitle" TEXT NOT NULL,
    "recommendedVariantId" TEXT NOT NULL DEFAULT '',
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CrossSellRule" ("createdAt", "discountPercent", "enabled", "id", "recommendedProductId", "recommendedProductTitle", "shop", "sourceProductId", "sourceProductTitle", "updatedAt") SELECT "createdAt", "discountPercent", "enabled", "id", "recommendedProductId", "recommendedProductTitle", "shop", "sourceProductId", "sourceProductTitle", "updatedAt" FROM "CrossSellRule";
DROP TABLE "CrossSellRule";
ALTER TABLE "new_CrossSellRule" RENAME TO "CrossSellRule";
CREATE INDEX "CrossSellRule_shop_sourceProductId_idx" ON "CrossSellRule"("shop", "sourceProductId");
CREATE UNIQUE INDEX "CrossSellRule_shop_sourceProductId_recommendedProductId_key" ON "CrossSellRule"("shop", "sourceProductId", "recommendedProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
