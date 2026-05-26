"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  id: string;
  url: string;
  name: string;
}

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        if (zoom) setZoom(false);
        else onClose();
        break;
      case "ArrowLeft":
        if (!zoom && currentIndex > 0) onNavigate(currentIndex - 1);
        break;
      case "ArrowRight":
        if (!zoom && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
        break;
    }
  };

  const handleDownload = async () => {
    const img = images[currentIndex];
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = img.name || `photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = img.url;
      a.download = img.name || `photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={() => { if (zoom) setZoom(false); else onClose(); }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm tracking-wider">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(!zoom); }}
            className={`p-2 rounded-full transition-colors ${
              zoom ? "bg-gold/20 text-gold" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {zoom ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              )}
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Download image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {hasPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); if (!zoom) onNavigate(currentIndex - 1); }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white rounded-full hover:bg-white/10 z-10 transition-all disabled:opacity-20"
          aria-label="Previous"
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); if (!zoom) onNavigate(currentIndex + 1); }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white rounded-full hover:bg-white/10 z-10 transition-all"
          aria-label="Next"
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <motion.div
        key={currentImage.id + (zoom ? "-zoom" : "-fit")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center justify-center ${zoom ? "max-w-none max-h-none w-full h-full overflow-hidden" : "max-w-[92vw] max-h-[88vh]"}`}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
      >
        {zoom ? (
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="absolute max-w-none max-h-none"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: "scale(2.5)",
                left: `${-zoomPos.x * 2.5 + 50 * 2.5}%`,
                top: `${-zoomPos.y * 2.5 + 50 * 2.5}%`,
                width: "250%",
                height: "250%",
                objectFit: "cover",
              }}
              draggable={false}
            />
          </div>
        ) : (
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className="max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-lg select-none cursor-pointer"
            draggable={false}
            onClick={(e) => { e.stopPropagation(); setZoom(true); }}
          />
        )}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {zoom && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(false); }}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white text-xs rounded-full hover:bg-white/20 transition-colors"
          >
            Exit Zoom
          </button>
        </div>
      )}
    </motion.div>
  );
}
