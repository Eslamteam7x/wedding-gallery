import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@wedding.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@wedding.com",
      password: await hash("admin123", 12),
      role: "ADMIN",
    },
  });

  console.log(`Admin created: ${admin.email} / admin123`);

  const group = await prisma.group.upsert({
    where: { id: "main-gallery" },
    update: {},
    create: {
      id: "main-gallery",
      name: "Main Gallery",
      description: "All wedding photos",
      isPublic: true,
      ownerId: admin.id,
    },
  });

  console.log(`Group created: ${group.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
