-- CreateTable
CREATE TABLE "Condominium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "billingEmail" TEXT,
    "whatsapp" TEXT,
    "sindicoName" TEXT,
    "sindicoEmail" TEXT,
    "sindicoWhatsapp" TEXT,
    "address" TEXT,
    "unitCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "condoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminUserCondominium" (
    "adminUserId" TEXT NOT NULL,
    "condominiumId" TEXT NOT NULL,

    PRIMARY KEY ("adminUserId", "condominiumId"),
    CONSTRAINT "AdminUserCondominium_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminUserCondominium_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Residence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "block" TEXT,
    "tower" TEXT,
    "number" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Residence_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residenceId" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT,
    "photo" TEXT,
    "rg" TEXT,
    "cpf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resident_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resident_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "residenceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryType" TEXT NOT NULL DEFAULT 'PACKAGE',
    "courier" TEXT,
    "trackingCode" TEXT,
    "pickupCode" TEXT,
    "arrivalDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "deliveryPhoto" TEXT,
    "releasePhoto" TEXT,
    "deliveredTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Package_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Package_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "condoId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setting_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Residence_condoId_idx" ON "Residence"("condoId");

-- CreateIndex
CREATE INDEX "Resident_condoId_idx" ON "Resident"("condoId");

-- CreateIndex
CREATE INDEX "Resident_residenceId_idx" ON "Resident"("residenceId");

-- CreateIndex
CREATE INDEX "Package_condoId_status_idx" ON "Package"("condoId", "status");

-- CreateIndex
CREATE INDEX "Package_residenceId_idx" ON "Package"("residenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_condoId_key_key" ON "Setting"("condoId", "key");
