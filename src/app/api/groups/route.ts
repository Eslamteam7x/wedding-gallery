import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJSON, writeJSON, PATHS } from "@/lib/github-storage";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await readJSON<any[]>(PATHS.GROUPS);
  const members = await readJSON<any[]>(PATHS.GROUP_MEMBERS);
  const photos = await readJSON<any[]>(PATHS.PHOTOS);

  const visible = groups.filter((g) => {
    if (g.isPublic) return true;
    if (g.ownerId === session.user.id) return true;
    return members.some((m) => m.groupId === g.id && m.userId === session.user.id);
  });

  const result = visible.map((g) => ({
    ...g,
    _count: {
      photos: photos.filter((p) => p.groupId === g.id).length,
      members: members.filter((m) => m.groupId === g.id).length,
    },
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, isPublic } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const groups = await readJSON<any[]>(PATHS.GROUPS);

  const group = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim() || "",
    isPublic: isPublic || false,
    ownerId: session.user.id,
    createdAt: new Date().toISOString(),
  };

  groups.push(group);

  const saved = await writeJSON(PATHS.GROUPS, groups);
  if (!saved) {
    return NextResponse.json(
      { error: "Failed to save to GitHub. Set GITHUB_TOKEN in Vercel env vars." },
      { status: 500 }
    );
  }

  return NextResponse.json(group, { status: 201 });
}
