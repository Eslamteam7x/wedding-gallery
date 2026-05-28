"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox from "./Lightbox";

interface GalleryImage {
  id: string;
  url: string;
  name: string;
}

interface GalleryProps {
  images: GalleryImage[];
  onDeleteImage: (id: string) => void;
  isAdmin?: boolean;
}

export default function Gallery({ images, onDeleteImage, isAdmin = false }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <section id="gallery" className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center"
          >
            <span className="text-gold text-xs tracking-[0.3em] uppercase">
              Gallery
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-white mt-4 mb-4">
              Wedding Photos
            </h2>
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="p-4 rounded-full bg-white/5">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white/30 text-sm">
                No photos yet. Upload your wedding photos above!
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <span className="text-gold text-xs tracking-[0.3em] uppercase">
            Gallery
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mt-4 mb-2">
            Wedding Photos
          </h2>
          <p className="text-white/30 text-sm">
            {images.length} {images.length === 1 ? "photo" : "photos"} shared
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [&>*]:mb-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="break-inside-avoid group relative cursor-pointer rounded-xl overflow-hidden"
                onClick={() => setLightboxIndex(index)}
              >
                <div className="relative overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(image.id);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-full bg-black/50 hover:bg-red-500/80 text-white scale-90 group-hover:scale-100"
                      aria-label="Delete image"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
