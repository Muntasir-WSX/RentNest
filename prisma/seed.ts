import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../prisma/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ADMIN_EMAIL = "admin@rentnest.com";
const ADMIN_PASSWORD = "admin123";
const LANDLORD_EMAIL = "landlord@rentnest.com";
const LANDLORD_PASSWORD = "landlord123";
const TENANT_EMAIL = "tenant@rentnest.com";
const TENANT_PASSWORD = "tenant123";

async function main() {
  const [adminPassword, landlordPassword, tenantPassword] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 10),
    bcrypt.hash(LANDLORD_PASSWORD, 10),
    bcrypt.hash(TENANT_PASSWORD, 10),
  ]);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "RentNest Admin",
      password: adminPassword,
      role: Role.ADMIN,
      isBanned: false,
    },
    create: {
      name: "RentNest Admin",
      email: ADMIN_EMAIL,
      password: adminPassword,
      role: Role.ADMIN,
      isBanned: false,
      phone: null,
    },
  });

  await prisma.user.upsert({
    where: { email: LANDLORD_EMAIL },
    update: {
      name: "Test Landlord",
      password: landlordPassword,
      role: Role.LANDLORD,
      isBanned: false,
      phone: "01711111111",
    },
    create: {
      name: "Test Landlord",
      email: LANDLORD_EMAIL,
      password: landlordPassword,
      role: Role.LANDLORD,
      isBanned: false,
      phone: "01711111111",
    },
  });

  await prisma.user.upsert({
    where: { email: TENANT_EMAIL },
    update: {
      name: "Test Tenant",
      password: tenantPassword,
      role: Role.TENANT,
      isBanned: false,
      phone: "01722222222",
    },
    create: {
      name: "Test Tenant",
      email: TENANT_EMAIL,
      password: tenantPassword,
      role: Role.TENANT,
      isBanned: false,
      phone: "01722222222",
    },
  });

  const categoryNames = ["Apartment", "House", "Studio"];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { name },
      create: { name },
    });
  }

  console.log("Seed finished successfully.");
  console.log("Admin:", ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log("Landlord:", LANDLORD_EMAIL, LANDLORD_PASSWORD);
  console.log("Tenant:", TENANT_EMAIL, TENANT_PASSWORD);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });