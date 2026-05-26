import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, any> = {};

  checks.hasDatabaseUrl = !!process.env.DATABASE_URL;
  checks.hasAuthSecret = !!process.env.AUTH_SECRET;
  checks.nodeEnv = process.env.NODE_ENV;
  checks.vercelEnv = process.env.VERCEL_ENV || "local";

  try {
    const result = await prisma.$queryRaw`SELECT current_database() as db`;
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
