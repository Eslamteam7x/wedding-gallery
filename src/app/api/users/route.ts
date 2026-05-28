import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readJSON, writeJSON, PATHS } from "@/lib/github-storage";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await readJSON<any[]>(PATHS.USERS);
  const safe = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const users = await readJSON<any[]>(PATHS.USERS);
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name?.trim() || null,
    email: email.trim(),
    password: await hash(password, 12),
    role: role || "USER",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeJSON(PATHS.USERS, users);

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, role } = await req.json();
  const users = await readJSON<any[]>(PATHS.USERS);
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (name !== undefined) users[idx].name = name.trim() || null;
  if (role !== undefined) users[idx].role = role;

  await writeJSON(PATHS.USERS, users);

  return NextResponse.json({
    id: users[idx].id,
    name: users[idx].name,
    email: users[idx].email,
    role: users[idx].role,
    createdAt: users[idx].createdAt,
  });
}
