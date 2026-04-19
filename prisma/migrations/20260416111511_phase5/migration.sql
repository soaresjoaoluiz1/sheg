-- CreateTable
CREATE TABLE "AdCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT,
    "coverImage" TEXT,
    "logo" TEXT,
    "deliveryMode" TEXT NOT NULL DEFAULT 'both',
    "deliveryFee" REAL,
    "minOrder" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advertiser_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AdCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvertiserCondo" (
    "advertiserId" TEXT NOT NULL,
    "condominiumId" TEXT NOT NULL,

    PRIMARY KEY ("advertiserId", "condominiumId"),
    CONSTRAINT "AdvertiserCondo_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdvertiserCondo_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvertiserProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdvertiserProduct_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdsAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "photos" TEXT,
    "category" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "isResident" BOOLEAN NOT NULL DEFAULT false,
    "residentName" TEXT,
    "block" TEXT,
    "unit" TEXT,
    "condoName" TEXT,
    "extrasMode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdsAudit_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "advertiserId" TEXT,
    "orderNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deliveryMode" TEXT NOT NULL DEFAULT 'delivery',
    "tower" TEXT,
    "block" TEXT,
    "unit" TEXT,
    "schedule" TEXT,
    "additionalInfo" TEXT,
    "items" TEXT,
    "total" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdCategory_sortOrder_idx" ON "AdCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "Advertiser_active_idx" ON "Advertiser"("active");

-- CreateIndex
CREATE INDEX "AdvertiserProduct_advertiserId_idx" ON "AdvertiserProduct"("advertiserId");

-- CreateIndex
CREATE INDEX "AdsAudit_advertiserId_idx" ON "AdsAudit"("advertiserId");

-- CreateIndex
CREATE INDEX "AdsAudit_visible_idx" ON "AdsAudit"("visible");

-- CreateIndex
CREATE INDEX "Order_condoId_status_idx" ON "Order"("condoId", "status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
