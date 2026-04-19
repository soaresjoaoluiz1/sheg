import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const condo = await db.condominium.upsert({
    where: { id: "seed-condo-1" },
    update: {},
    create: {
      id: "seed-condo-1",
      name: "Residencial Demo",
      cnpj: "00.000.000/0001-00",
      email: "contato@residencial-demo.local",
      whatsapp: "+5511999999999",
      address: "Rua Exemplo, 123 — São Paulo, SP",
      unitCount: 40,
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await db.adminUser.upsert({
    where: { email: "admin@shegou.dev" },
    update: { passwordHash },
    create: {
      email: "admin@shegou.dev",
      passwordHash,
      fullName: "Administrador Master",
      role: "ADMIN",
      isMaster: true,
      condoId: condo.id,
    },
  });

  await db.adminUserCondominium.upsert({
    where: {
      adminUserId_condominiumId: {
        adminUserId: admin.id,
        condominiumId: condo.id,
      },
    },
    update: {},
    create: {
      adminUserId: admin.id,
      condominiumId: condo.id,
    },
  });

  const existing = await db.residence.count({ where: { condoId: condo.id } });
  if (existing === 0) {
    const residences = [];
    for (const block of ["A", "B"]) {
      for (let unit = 101; unit <= 110; unit++) {
        residences.push({
          condoId: condo.id,
          block,
          tower: block,
          number: String(unit),
        });
      }
    }
    await db.residence.createMany({ data: residences });
  }

  const firstResidence = await db.residence.findFirst({ where: { condoId: condo.id } });
  if (firstResidence) {
    const residentCount = await db.resident.count({
      where: { residenceId: firstResidence.id },
    });
    if (residentCount === 0) {
      const moradorPasswordHash = await bcrypt.hash("morador123", 10);
      await db.resident.createMany({
        data: [
          {
            residenceId: firstResidence.id,
            condoId: condo.id,
            name: "Ana Silva",
            whatsapp: "+5511988887777",
            email: "ana@shegou.dev",
            passwordHash: moradorPasswordHash,
            loginEnabled: true,
          },
          {
            residenceId: firstResidence.id,
            condoId: condo.id,
            name: "Bruno Costa",
            whatsapp: "+5511977776666",
          },
        ],
      });
    } else {
      const ana = await db.resident.findFirst({
        where: { residenceId: firstResidence.id, name: "Ana Silva" },
      });
      if (ana && !ana.loginEnabled) {
        const moradorPasswordHash = await bcrypt.hash("morador123", 10);
        await db.resident.update({
          where: { id: ana.id },
          data: { passwordHash: moradorPasswordHash, loginEnabled: true, email: "ana@shegou.dev" },
        });
      }
    }

    const pkgCount = await db.package.count({ where: { condoId: condo.id } });
    if (pkgCount === 0) {
      await db.package.createMany({
        data: [
          {
            condoId: condo.id,
            residenceId: firstResidence.id,
            courier: "Correios",
            trackingCode: "BR123456789BR",
            pickupCode: "ABC123",
            deliveryType: "PACKAGE",
            status: "PENDING",
          },
          {
            condoId: condo.id,
            residenceId: firstResidence.id,
            courier: "iFood",
            deliveryType: "FAST_DELIVERY",
            status: "PENDING",
          },
        ],
      });
    }
  }

  console.log("Seed concluído.");
  console.log("Admin: admin@shegou.dev / admin123");
  console.log("Morador: ana@shegou.dev (ou +5511988887777) / morador123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
