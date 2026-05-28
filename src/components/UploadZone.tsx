"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";

interface Group {
  id: string;
  name: string;
}

interface UploadZoneProps {
  groups: Group[];
  selectedGroupId: string | null;
}

export default function UploadZone({ groups, selectedGroupId }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!selectedGroupId) {
      setMessage("Please select a group first");
      return;
    }

    setUploading(true);
    setMessage("");

    let uploaded = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", selectedGroupId);

      try {
        const res = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });
        if (res.ok) uploaded++;
        else if (uploaded === 0) {
          const data = await res.json().catch(() => ({}));
          setMessage(data.error || "Upload failed");
        }
      } catch {}
    }

    setUploading(false);
    setMessage(`${uploaded} of ${files.length} photos uploaded`);
    setTimeout(() => setMessage(""), 3000);
  }, [selectedGroupId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section id="upload" className="py-24 md:py-32 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase">
            Share Your Moments
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mt-4 mb-4">
            Upload Your Photos
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            Drag and drop your favorite wedding photos below, or click to browse.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.15 }}
        >
          {!selectedGroupId && groups.length === 0 && (
            <div className="text-center mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-white/30 text-xs">
                No groups available. An admin needs to create a group first.
              </p>
            </div>
          )}

          {!selectedGroupId && groups.length > 0 && (
            <div className="text-center mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-gold text-xs">
                Select a group from the sidebar to upload photos
              </p>
            </div>
          )}

          <div
            onClick={selectedGroupId ? handleClick : undefined}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 md:p-20 text-center transition-all duration-300 ${
              !selectedGroupId
                ? "border-white/5 bg-white/[0.01] cursor-not-allowed opacity-50"
                : isDragging
                ? "border-gold bg-gold/5 scale-[1.02] shadow-lg shadow-gold/5 cursor-pointer"
                : "border-white/10 hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-5">
              <div
                className={`p-4 rounded-full transition-all duration-300 ${
                  isDragging ? "bg-gold/10 text-gold" : "bg-white/5 text-white/30"
                }`}
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <p className="text-white/70 text-sm md:text-base">
                  {uploading ? (
                    <span className="text-gold">Uploading...</span>
                  ) : isDragging ? (
                    <span className="text-gold">Drop your images here</span>
                  ) : (
                    <>
                      <span className="text-white/90 font-medium">Click to browse</span>{" "}
                      <span className="text-white/40">or drag and drop</span>
                    </>
                  )}
                </p>
                <p className="text-white/20 text-xs">PNG, JPG, WebP &middot; Max 10MB each</p>
              </div>

              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gold text-xs"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
