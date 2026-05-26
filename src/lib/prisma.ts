import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    ""
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
