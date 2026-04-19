-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "role" TEXT,
    "contact" TEXT,
    "company" TEXT,
    "monthlyBilling" REAL,
    "projectedRevenue" REAL,
    "referralSource" TEXT,
    "testStart" DATETIME,
    "testDays" INTEGER,
    "paymentDay" INTEGER,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'prospeccao',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MapPin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "MapPin_active_idx" ON "MapPin"("active");
