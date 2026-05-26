export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/20 text-xs tracking-wider">
          Made with love
        </p>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-gold/50" />
          <p className="text-white/15 text-xs">
            &copy; {new Date().getFullYear()} Wedding Gallery
          </p>
        </div>
        <p className="text-white/20 text-xs tracking-wider font-serif">
          فرح
        </p>
      </div>
    </footer>
  );
}
