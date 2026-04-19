-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residenceId" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "model" TEXT,
    "year" TEXT,
    "plate" TEXT,
    "platePhoto" TEXT,
    "vehiclePhoto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacilitisService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" DATETIME,
    "collaborator" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacilitisService_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacilitisCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FacilitisCollaboratorCondo" (
    "collaboratorId" TEXT NOT NULL,
    "condominiumId" TEXT NOT NULL,

    PRIMARY KEY ("collaboratorId", "condominiumId"),
    CONSTRAINT "FacilitisCollaboratorCondo_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "FacilitisCollaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacilitisCollaboratorCondo_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Vehicle_condoId_idx" ON "Vehicle"("condoId");

-- CreateIndex
CREATE INDEX "Vehicle_residenceId_idx" ON "Vehicle"("residenceId");

-- CreateIndex
CREATE INDEX "FacilitisService_condoId_status_idx" ON "FacilitisService"("condoId", "status");
