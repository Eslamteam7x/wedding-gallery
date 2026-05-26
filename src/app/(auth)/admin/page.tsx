"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [user, ...prev]);
      setName("");
      setEmail("");
      setPassword("");
      setShowCreate(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-black pt-24 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif text-white">Admin Panel</h1>
              <p className="text-white/40 text-sm mt-1">Manage users and permissions</p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-gold text-black text-sm rounded-lg hover:bg-gold-light transition-colors"
            >
              {showCreate ? "Cancel" : "Add User"}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold/50"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-black text-sm rounded-lg hover:bg-gold-light transition-colors"
              >
                Create User
              </button>
            </form>
          )}

          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm truncate">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="text-white/30 text-xs truncate">{user.email}</p>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="ml-4 px-3 py-1 bg-black border border-white/10 rounded text-white text-xs focus:outline-none focus:border-gold/50"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
