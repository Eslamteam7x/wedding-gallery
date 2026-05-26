"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <a
          href="/"
          className="text-2xl font-serif tracking-widest text-white hover:text-gold transition-colors duration-300"
        >
          فرح
        </a>

        <div className="hidden md:flex items-center gap-6">
          {session && (
            <>
              <a href="/#gallery" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">
                Gallery
              </a>
              <a href="/#upload" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">
                Upload
              </a>
            </>
          )}

          {session ? (
            <>
              {session.user?.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="text-sm text-gold/70 hover:text-gold transition-colors tracking-wide"
                >
                  Admin
                </a>
              )}
              <span className="text-white/30 text-xs">{session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-white/40 hover:text-white transition-colors tracking-wide"
              >
                Sign Out
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors tracking-wide"
            >
              Sign In
            </a>
          )}
        </div>

        <button className="md:hidden text-white/60 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </motion.header>
  );
}
