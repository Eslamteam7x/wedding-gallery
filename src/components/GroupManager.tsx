"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  _count: { photos: number; members: number };
}

export default function GroupManager({
  onSelectGroup,
  selectedGroupId,
}: {
  onSelectGroup: (group: Group | null) => void;
  selectedGroupId: string | null;
}) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPublic }),
    });
    if (res.ok) {
      const group = await res.json();
      setGroups((prev) => [group, ...prev]);
      setName("");
      setDescription("");
      setShowCreate(false);
      onSelectGroup(group);
    } else {
      const data = await res.json().catch(() => ({ error: "Request failed" }));
      setCreateError(data.error || "Failed to create group");
    }
  };

  const handleDelete = async (groupId: string) => {
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (selectedGroupId === groupId) onSelectGroup(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-medium">Groups</h3>
        {session?.user?.role === "ADMIN" && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs text-gold hover:text-gold-light transition-colors"
          >
            {showCreate ? "Cancel" : "+ New Group"}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
          {createError && (
            <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{createError}</p>
          )}
          <input
            type="text"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-gold/50"
          />
          <label className="flex items-center gap-2 text-white/50 text-xs">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-gold"
            />
            Public group (visible to all users)
          </label>
          <button
            type="submit"
            className="w-full py-2 bg-gold text-black text-sm rounded-lg hover:bg-gold-light transition-colors"
          >
            Create Group
          </button>
        </form>
      )}

      <div className="space-y-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectGroup(null)}
          className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
            selectedGroupId === null
              ? "bg-gold/10 border border-gold/30 text-gold"
              : "bg-white/[0.02] border border-white/5 text-white/60 hover:bg-white/[0.06]"
          }`}
        >
          <span className="font-medium">All Photos</span>
          <span className="text-white/30 text-xs ml-2">
            ({groups.reduce((sum, g) => sum + g._count.photos, 0)})
          </span>
        </motion.button>

        {groups.map((group) => (
          <motion.div
            key={group.id}
            whileTap={{ scale: 0.98 }}
            className={`group cursor-pointer p-3 rounded-lg transition-all text-sm ${
              selectedGroupId === group.id
                ? "bg-gold/10 border border-gold/30 text-gold"
                : "bg-white/[0.02] border border-white/5 text-white/60 hover:bg-white/[0.06]"
            }`}
            onClick={() => onSelectGroup(group)}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{group.name}</p>
                <p className="text-xs text-white/30 truncate">
                  {group._count.photos} photos &middot; {group._count.members} members
                  {group.isPublic && " &middot; Public"}
                </p>
              </div>
              {(session?.user?.role === "ADMIN" || group.ownerId === session?.user?.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {groups.length === 0 && (
          <p className="text-white/20 text-xs text-center py-4">
            No groups yet. {session?.user?.role === "ADMIN" && "Create one above."}
          </p>
        )}
      </div>
    </div>
  );
}
