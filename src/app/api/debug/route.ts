import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, any> = {};

  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || "local",
  };

  try {
    const result = await prisma.$queryRaw`SELECT current_database() as db, version() as ver`;
    checks.dbConnection = "ok";
    checks.dbInfo = result;
  } catch (err: any) {
    checks.dbConnection = "failed";
    checks.dbError = err?.message || String(err);
  }

  try {
    const userCount = await prisma.user.count();
    const groupCount = await prisma.group.count();
    const photoCount = await prisma.photo.count();
    checks.tables = { users: userCount, groups: groupCount, photos: photoCount };
  } catch (err: any) {
    checks.tables = "error: " + (err?.message || String(err));
  }

  return NextResponse.json(checks);
}
