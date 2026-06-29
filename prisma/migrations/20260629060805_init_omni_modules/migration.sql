-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "popupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "popupTitle" TEXT NOT NULL DEFAULT '限时优惠',
    "popupMessage" TEXT NOT NULL DEFAULT '首单立享 10% 折扣，立即选购！',
    "popupButtonText" TEXT NOT NULL DEFAULT '立即选购',
    "popupButtonUrl" TEXT NOT NULL DEFAULT '/collections/all',
    "popupDelaySeconds" INTEGER NOT NULL DEFAULT 3,
    "popupBgColor" TEXT NOT NULL DEFAULT '#111827',
    "popupTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrossSellRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceProductTitle" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "recommendedProductTitle" TEXT NOT NULL,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PopupEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "CrossSellRule_shop_sourceProductId_idx" ON "CrossSellRule"("shop", "sourceProductId");

-- CreateIndex
CREATE UNIQUE INDEX "CrossSellRule_shop_sourceProductId_recommendedProductId_key" ON "CrossSellRule"("shop", "sourceProductId", "recommendedProductId");

-- CreateIndex
CREATE INDEX "PopupEvent_shop_eventType_idx" ON "PopupEvent"("shop", "eventType");
