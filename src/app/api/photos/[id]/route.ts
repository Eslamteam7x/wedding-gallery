import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { group: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await prisma.photo.delete({ where: { id } });

  try {
    const filePath = join(process.cwd(), "public", photo.url);
    await unlink(filePath);
  } catch {}

  return NextResponse.json({ success: true });
}
