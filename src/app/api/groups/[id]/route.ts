import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      photos: {
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { photos: true, members: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const canView =
    group.isPublic ||
    group.ownerId === session.user.id ||
    group.members.some((m) => m.userId === session.user.id);

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });

  if (!group || group.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, isPublic } = await req.json();

  const updated = await prisma.group.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });

  if (!group || (group.ownerId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
