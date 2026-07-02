"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, ArrowRight, User, Shield } from "lucide-react";
import { useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { name: "Tools", href: "/tools" },
    { name: "Insights", href: "/insights" },
    { name: "Glossary", href: "/glossary" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Boardroom", href: "/module" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#05060a]/80 backdrop-blur-md border-[#ffffff]/5 shadow-lg"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#aab2c5] to-[#4f7cff] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            NumberIQ
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-1.5 py-0.5 rounded border border-[#4f7cff]/20">
            beta
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-1.5 text-sm font-medium transition-colors hover:text-white rounded-full text-[#aab2c5]"
              >
                {isActive && (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute inset-0 bg-white/5 rounded-full border border-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTAs & Theme Toggle */}
        <div className="hidden md:flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[#aab2c5] hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          {session ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              <User size={14} className="text-[#4f7cff]" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/tools"
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#4f7cff] hover:bg-[#3d66dd] text-white transition-all shadow-[0_0_15px_rgba(79,124,255,0.25)] hover:shadow-[0_0_20px_rgba(79,124,255,0.4)] cursor-pointer"
            >
              Open Workspace
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-full border border-white/5 bg-white/5 text-[#aab2c5] cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-full border border-white/5 bg-white/5 text-[#aab2c5] hover:text-white cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 border-b border-[#ffffff]/5 bg-[#05060a]/95 backdrop-blur-lg flex flex-col p-6 gap-4 z-40 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-[#aab2c5] hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-white/5" />
            {session ? (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                <User size={14} className="text-[#4f7cff]" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/tools"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg bg-[#4f7cff] text-white hover:bg-[#3d66dd] transition-colors"
              >
                Open Workspace
                <ArrowRight size={14} />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
