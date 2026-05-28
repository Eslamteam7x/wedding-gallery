import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await prisma.photo.findMany({
    where: {
      group: {
        OR: [
          { isPublic: true },
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: {
      uploader: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const groupId = formData.get("groupId") as string | null;

  if (!file || !groupId) {
    return NextResponse.json({ error: "File and groupId are required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const url = await saveImage(file);

  const photo = await prisma.photo.create({
    data: {
      url,
      name: file.name,
      uploadedById: session.user.id,
      groupId,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
