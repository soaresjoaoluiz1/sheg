-- CreateTable
CREATE TABLE "Occurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "complainantName" TEXT,
    "complainantUnit" TEXT,
    "offenderUnit" TEXT,
    "offenderResidenceId" TEXT,
    "photo" TEXT,
    "notifiedAt" DATETIME,
    "adminResponse" TEXT,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Occurrence_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Occurrence_offenderResidenceId_fkey" FOREIGN KEY ("offenderResidenceId") REFERENCES "Residence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "reporterName" TEXT,
    "reporterBlock" TEXT,
    "reporterTower" TEXT,
    "reporterUnit" TEXT,
    "reporterPhone" TEXT,
    "targetResidentName" TEXT,
    "targetBlock" TEXT,
    "targetTower" TEXT,
    "targetUnit" TEXT,
    "photoUrl" TEXT,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Complaint_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Occurrence_condoId_status_idx" ON "Occurrence"("condoId", "status");

-- CreateIndex
CREATE INDEX "Occurrence_offenderResidenceId_idx" ON "Occurrence"("offenderResidenceId");

-- CreateIndex
CREATE INDEX "Occurrence_createdAt_idx" ON "Occurrence"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_condoId_status_idx" ON "Complaint"("condoId", "status");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");
