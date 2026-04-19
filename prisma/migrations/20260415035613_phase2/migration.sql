-- CreateTable
CREATE TABLE "MessageQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "packageId" TEXT,
    "residentId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageQueue_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "photoUrl" TEXT,
    "targetType" TEXT NOT NULL DEFAULT 'condo',
    "targetId" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notice_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackageReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "hoursBucket" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackageReminder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessageQueue_condoId_status_idx" ON "MessageQueue"("condoId", "status");

-- CreateIndex
CREATE INDEX "MessageQueue_scheduledAt_idx" ON "MessageQueue"("scheduledAt");

-- CreateIndex
CREATE INDEX "Notice_condoId_idx" ON "Notice"("condoId");

-- CreateIndex
CREATE INDEX "Notice_createdAt_idx" ON "Notice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PackageReminder_packageId_hoursBucket_key" ON "PackageReminder"("packageId", "hoursBucket");
