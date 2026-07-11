"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, ArrowRight, User } from "lucide-react";
import { useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hash, setHash] = useState("");
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if page is scrolled
      setScrolled(currentScrollY > 20);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync hash state and track scrolling for home/services highlighting
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHash(window.location.hash);
      const handleHashChange = () => {
        setHash(window.location.hash);
      };
      window.addEventListener("hashchange", handleHashChange);

      let observer: IntersectionObserver | null = null;
      if (pathname === "/") {
        const sections = ["home", "services"];
        const elements = sections.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const id = entry.target.id;
                if (id === "services") {
                  setHash("#services");
                } else if (id === "home") {
                  setHash("");
                }
              }
            });
          },
          { threshold: 0.2, rootMargin: "-80px 0px -50% 0px" }
        );

        elements.forEach(el => observer?.observe(el));
      } else {
        setHash("");
      }

      return () => {
        window.removeEventListener("hashchange", handleHashChange);
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [pathname]);

  const links = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/#services" },
    { name: "Tools", href: "/tools" },
    { name: "Glossary", href: "/glossary" },
    { name: "Insights", href: "/insights" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled
          ? "bg-black/45 backdrop-blur-md border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#aab2c5] to-[#3b82f6] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            NumberIQ
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/25">
            HQ
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] border border-white/5 px-2 py-1.5 rounded-full backdrop-blur-sm">
          {links.map((link) => {
            let isActive = false;
            if (link.href === "/") {
              isActive = pathname === "/" && hash !== "#services";
            } else if (link.href === "/#services") {
              isActive = pathname === "/" && hash === "#services";
            } else {
              isActive = pathname.startsWith(link.href);
            }
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white rounded-full ${
                  isActive ? "text-white" : "text-[#737c92]"
                }`}
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
        <div className="hidden lg:flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[#737c92] hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          {session ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              <User size={14} className="text-[#3b82f6]" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/tools"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer"
            >
              Open Terminal
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full border border-white/5 bg-white/5 text-[#737c92] cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full border border-white/5 bg-white/5 text-[#737c92] hover:text-white cursor-pointer"
            aria-label="Toggle Menu"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation-drawer"
            role="navigation"
            aria-label="Mobile Navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-0 right-0 border-b border-white/5 bg-[#050505]/95 backdrop-blur-lg flex flex-col p-6 gap-4 z-40 lg:hidden shadow-2xl"
          >
            {links.map((link) => {
              let isActive = false;
              if (link.href === "/") {
                isActive = pathname === "/" && hash !== "#services";
              } else if (link.href === "/#services") {
                isActive = pathname === "/" && hash === "#services";
              } else {
                isActive = pathname.startsWith(link.href);
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                    isActive ? "text-white" : "text-[#737c92] hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <hr className="border-white/5" />
            {session ? (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-3 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                <User size={14} className="text-[#3b82f6]" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/tools"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-white transition-colors"
              >
                Open Terminal
                <ArrowRight size={14} />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
