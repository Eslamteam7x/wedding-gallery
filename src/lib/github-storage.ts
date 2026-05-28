import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

const GITHUB_TOKEN = () => process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = () => process.env.GITHUB_OWNER || "Eslamteam7x";
const GITHUB_REPO = () => process.env.GITHUB_REPO || "wedding-gallery";
const GITHUB_BRANCH = () => process.env.GITHUB_BRANCH || "main";

const API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN()}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "wedding-gallery",
  };
}

interface GitHubFile {
  sha: string;
  content: string;
}

async function getFile(path: string): Promise<GitHubFile | null> {
  try {
    const res = await fetch(
      `${API}/repos/${GITHUB_OWNER()}/${GITHUB_REPO()}/contents/${path}?ref=${GITHUB_BRANCH()}`,
      { headers: headers(), next: { revalidate: 0 } }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    return {
      sha: data.sha,
      content: Buffer.from(data.content, "base64").toString("utf-8"),
    };
  } catch (err) {
    console.error("GitHub storage: getFile error", err);
    return null;
  }
}

async function putFile(path: string, content: string, sha?: string, message?: string) {
  const res = await fetch(
    `${API}/repos/${GITHUB_OWNER()}/${GITHUB_REPO()}/contents/${path}`,
    {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || `Update ${path}`,
        content: Buffer.from(content).toString("base64"),
        sha,
        branch: GITHUB_BRANCH(),
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub API error (PUT): ${res.status}`);
  return res.json();
}

async function deleteFile(path: string, sha: string, message?: string) {
  const res = await fetch(
    `${API}/repos/${GITHUB_OWNER()}/${GITHUB_REPO()}/contents/${path}`,
    {
      method: "DELETE",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || `Delete ${path}`,
        sha,
        branch: GITHUB_BRANCH(),
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub API error (DELETE): ${res.status}`);
}

async function readLocalJSON<T>(path: string): Promise<T | null> {
  const relative = path.replace("data/", "");
  const localPath = join(getDataDir(), relative);
  try {
    const content = await readFile(localPath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    try {
      const content = await readFile(join(process.cwd(), path), "utf-8");
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }
}

export async function readJSON<T = any>(path: string): Promise<T> {
  const file = await getFile(path);
  if (file) return JSON.parse(file.content) as T;

  const local = await readLocalJSON<T>(path);
  if (local) return local;

  return (typeof [] as any) === "object" ? ([] as T) : ({} as T);
}

function getDataDir() {
  return process.env.VERCEL ? "/tmp/data" : join(process.cwd(), "data");
}

async function writeLocalJSON(path: string, data: any): Promise<boolean> {
  try {
    const fullPath = join(getDataDir(), path.replace("data/", ""));
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Local write fallback error:", err);
    return false;
  }
}

export async function writeJSON(path: string, data: any): Promise<boolean> {
  const serialized = JSON.stringify(data, null, 2);
  try {
    const existing = await getFile(path);
    if (existing) {
      await putFile(path, serialized, existing.sha);
    } else {
      await putFile(path, serialized);
    }
    return true;
  } catch (err) {
    console.error("GitHub write failed, trying local fallback:", err);
    return writeLocalJSON(path, data);
  }
}

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER()}/${GITHUB_REPO()}/${GITHUB_BRANCH()}`;

export async function uploadImage(filename: string, buffer: Buffer): Promise<string> {
  const path = `uploads/${filename}`;
  const existing = await getFile(path);
  await putFile(path, buffer.toString("base64"), existing?.sha, `Upload ${filename}`);
  return `${RAW_BASE}/${path}`;
}

export async function deleteImage(imageUrl: string) {
  if (!imageUrl.startsWith(RAW_BASE)) return;
  const path = imageUrl.slice(RAW_BASE.length + 1);
  const file = await getFile(path);
  if (file) {
    await deleteFile(path, file.sha, `Delete ${path}`);
  }
}

export const PATHS = {
  USERS: "data/users.json",
  GROUPS: "data/groups.json",
  GROUP_MEMBERS: "data/group-members.json",
  PHOTOS: "data/photos.json",
};
