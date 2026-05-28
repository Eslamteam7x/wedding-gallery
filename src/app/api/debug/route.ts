import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, any> = {};

  checks.env = {
    GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER || "not set (using default)",
    GITHUB_REPO: process.env.GITHUB_REPO || "not set (using default)",
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || "local",
  };

  try {
    const res = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER || "Eslamteam7x"}/${process.env.GITHUB_REPO || "wedding-gallery"}/contents/data/users.json`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "wedding-gallery",
        },
      }
    );
    checks.githubApi = res.ok ? "ok" : `error ${res.status}`;
    if (res.ok) {
      const data = await res.json();
      const content = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8")
      );
      checks.usersCount = content.length;
    }
  } catch (err: any) {
    checks.githubApi = "failed";
    checks.githubError = err?.message || String(err);
  }

  return NextResponse.json(checks);
}
