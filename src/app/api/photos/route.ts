import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJSON, writeJSON, uploadImage, PATHS } from "@/lib/github-storage";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await readJSON<any[]>(PATHS.PHOTOS);
  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const members = await readJSON<any[]>(PATHS.GROUP_MEMBERS);
  const users = await readJSON<any[]>(PATHS.USERS);

  const visible = photos.filter((p) => {
    const group = groups.find((g) => g.id === p.groupId);
    if (!group) return false;
    if (group.isPublic) return true;
    if (group.ownerId === session.user.id) return true;
    return members.some(
      (m) => m.groupId === p.groupId && m.userId === session.user.id
    );
  });

  const result = visible
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((p) => {
      const uploader = users.find((u) => u.id === p.uploadedById);
      const group = groups.find((g) => g.id === p.groupId);
      return {
        ...p,
        uploader: uploader
          ? { id: uploader.id, name: uploader.name }
          : null,
        group: group ? { id: group.id, name: group.name } : null,
      };
    });

  return NextResponse.json(result);
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
    return NextResponse.json(
      { error: "File and groupId are required" },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const url = await uploadImage(uniqueName, buffer);

  const photos = await readJSON<any[]>(PATHS.PHOTOS);
  const photo = {
    id: crypto.randomUUID(),
    url,
    name: file.name,
    uploadedById: session.user.id,
    groupId,
    createdAt: new Date().toISOString(),
  };

  photos.push(photo);
  const saved = await writeJSON(PATHS.PHOTOS, photos);
  if (!saved) {
    return NextResponse.json(
      { error: "Failed to save to GitHub. Set GITHUB_TOKEN in Vercel env vars." },
      { status: 500 }
    );
  }

  return NextResponse.json(photo, { status: 201 });
}
