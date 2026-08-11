import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("changeme123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ucup2026.cg" },
    update: {},
    create: {
      name: "Admin UCUP",
      email: "admin@ucup2026.cg",
      password: passwordHash,
      isAdmin: true,
    },
  });

  console.log("Admin créé :", admin.email, "(mot de passe : changeme123 — à changer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
