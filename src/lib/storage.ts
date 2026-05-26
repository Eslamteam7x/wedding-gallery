import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function saveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch {}

  const path = join(uploadDir, uniqueName);
  await writeFile(path, buffer);

  return `/uploads/${uniqueName}`;
}
