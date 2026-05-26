"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import UploadZone from "@/components/UploadZone";
import GroupManager from "@/components/GroupManager";
import Footer from "@/components/Footer";

interface GalleryImage {
  id: string;
  url: string;
  name: string;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  _count: { photos: number; members: number };
}

export default function Home() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const currentGroupId = selectedGroup?.id ?? null;

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      setImages(data.map((p: any) => ({
        id: p.id,
        url: p.url,
        name: p.name,
        groupId: p.groupId,
      })));
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      setGroups(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchImages();
      fetchGroups();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchImages, fetchGroups]);

  const handleImagesUpload = useCallback(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDeleteImage = useCallback(async (id: string) => {
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {}
  }, []);

  const handleSelectGroup = useCallback((group: Group | null) => {
    setSelectedGroup(group);
  }, []);

  const filteredImages = currentGroupId
    ? images.filter((img) => img.groupId === currentGroupId)
    : images;

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/30 text-xs tracking-wider">Loading gallery...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-black text-white">
        <Header />
        <Hero />
        <Gallery images={images} onDeleteImage={handleDeleteImage} />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <Hero />

      <div className="max-w-7xl mx-auto px-6 flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <GroupManager
              onSelectGroup={handleSelectGroup}
              selectedGroupId={currentGroupId}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <Gallery images={filteredImages} onDeleteImage={handleDeleteImage} />
        </div>
      </div>

      <UploadZone
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        selectedGroupId={currentGroupId}
      />

      <Footer />
    </main>
  );
}
