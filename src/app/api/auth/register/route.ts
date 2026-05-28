import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { readJSON, writeJSON, PATHS } from "@/lib/github-storage";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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
      role: "USER",
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await writeJSON(PATHS.USERS, users);

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
