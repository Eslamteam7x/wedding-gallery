import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJSON, writeJSON, deleteImage, PATHS } from "@/lib/github-storage";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const photos = await readJSON<any[]>(PATHS.PHOTOS);
  const idx = photos.findIndex((p) => p.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const photo = photos[idx];

  try {
    await deleteImage(photo.url);
  } catch {}

  photos.splice(idx, 1);
  await writeJSON(PATHS.PHOTOS, photos);

  return NextResponse.json({ success: true });
}
