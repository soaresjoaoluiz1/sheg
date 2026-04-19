-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residenceId" TEXT NOT NULL,
    "condoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT,
    "photo" TEXT,
    "rg" TEXT,
    "cpf" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "loginEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resident_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resident_condoId_fkey" FOREIGN KEY ("condoId") REFERENCES "Condominium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("condoId", "cpf", "createdAt", "id", "name", "photo", "residenceId", "rg", "updatedAt", "whatsapp") SELECT "condoId", "cpf", "createdAt", "id", "name", "photo", "residenceId", "rg", "updatedAt", "whatsapp" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE INDEX "Resident_condoId_idx" ON "Resident"("condoId");
CREATE INDEX "Resident_residenceId_idx" ON "Resident"("residenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
