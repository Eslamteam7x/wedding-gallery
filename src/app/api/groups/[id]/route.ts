import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJSON, writeJSON, PATHS } from "@/lib/github-storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const group = groups.find((g) => g.id === id);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const members = await readJSON<any[]>(PATHS.GROUP_MEMBERS);
  const photos = await readJSON<any[]>(PATHS.PHOTOS);
  const users = await readJSON<any[]>(PATHS.USERS);

  const canView =
    group.isPublic ||
    group.ownerId === session.user.id ||
    members.some((m) => m.groupId === id && m.userId === session.user.id);

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groupMembers = members
    .filter((m) => m.groupId === id)
    .map((m) => {
      const u = users.find((u) => u.id === m.userId);
      return {
        id: m.id,
        user: u ? { id: u.id, name: u.name, email: u.email } : null,
        userId: m.userId,
      };
    });

  const groupPhotos = photos
    .filter((p) => p.groupId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((p) => {
      const u = users.find((u) => u.id === p.uploadedById);
      return {
        ...p,
        uploader: u ? { id: u.id, name: u.name } : null,
      };
    });

  const owner = users.find((u) => u.id === group.ownerId);

  return NextResponse.json({
    ...group,
    owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    photos: groupPhotos,
    members: groupMembers,
    _count: {
      photos: groupPhotos.length,
      members: groupMembers.length,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const idx = groups.findIndex((g) => g.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (groups[idx].ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, isPublic } = await req.json();

  if (name !== undefined) groups[idx].name = name.trim();
  if (description !== undefined) groups[idx].description = description.trim();
  if (isPublic !== undefined) groups[idx].isPublic = isPublic;

  await writeJSON(PATHS.GROUPS, groups);

  return NextResponse.json(groups[idx]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const idx = groups.findIndex((g) => g.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (groups[idx].ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  groups.splice(idx, 1);
  await writeJSON(PATHS.GROUPS, groups);

  return NextResponse.json({ success: true });
}
