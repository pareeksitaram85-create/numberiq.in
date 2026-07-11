"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

// Custom Inline SVG Brand Icons to avoid missing brand icon exports in this version of lucide-react
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function AsmeLandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeAnimRef = useRef<number | null>(null);
  const fadingOutRef = useRef<boolean>(false);
  const [email, setEmail] = useState("");

  const startFade = (toOpacity: number, duration: number) => {
    if (fadeAnimRef.current) {
      cancelAnimationFrame(fadeAnimRef.current);
    }
    const video = videoRef.current;
    if (!video) return;

    const startOpacity = parseFloat(video.style.opacity || "0");
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentOpacity = startOpacity + (toOpacity - startOpacity) * progress;
      video.style.opacity = currentOpacity.toString();

      if (progress < 1) {
        fadeAnimRef.current = requestAnimationFrame(animate);
      } else {
        fadeAnimRef.current = null;
      }
    };

    fadeAnimRef.current = requestAnimationFrame(animate);
  };

  const handlePlay = () => {
    if (!fadingOutRef.current) {
      startFade(1, 500);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const remainingTime = video.duration - video.currentTime;
    if (remainingTime <= 0.55 && !fadingOutRef.current && video.duration > 0) {
      fadingOutRef.current = true;
      startFade(0, 500);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = "0";
    setTimeout(() => {
      video.currentTime = 0;
      video.play().catch((err) => console.log("Video play interrupted:", err));
      fadingOutRef.current = false;
      startFade(1, 500);
    }, 100);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.style.opacity = "0";
      video.play().catch((err) => console.log("Auto-play blocked or interrupted:", err));
    }
    return () => {
      if (fadeAnimRef.current) {
        cancelAnimationFrame(fadeAnimRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col text-white font-sans selection:bg-white/20 selection:text-white">
      {/* Dynamic Style injection for Custom Liquid Glass and Google Font */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
          
          .liquid-glass {
            background: rgba(255, 255, 255, 0.01);
            background-blend-mode: luminosity;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: none;
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }
          
          .liquid-glass::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1.4px;
            background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }
        `
      }} />

      {/* Looping Cinematic Background Video */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        muted
        playsInline
        autoPlay
        onPlay={handlePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%] pointer-events-none transition-none"
        style={{ opacity: 0 }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 pointer-events-none z-0" />

      {/* Navigation bar */}
      <header className="relative z-20 w-full px-6 py-6">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Globe className="text-white/90" size={24} />
            <span>Asme</span>
            
            {/* Nav links (hidden on mobile, shown on md:) */}
            <nav className="hidden md:flex items-center gap-8 ml-8">
              <Link href="#features" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Features</Link>
              <Link href="#pricing" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
              <Link href="#about" className="text-white/80 hover:text-white transition-colors text-sm font-medium">About</Link>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="text-white/80 hover:text-white transition-colors text-sm font-semibold px-2 cursor-pointer">
              Sign Up
            </button>
            <button className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-semibold hover:bg-white/5 transition-all cursor-pointer">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero content area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[2%] md:-translate-y-[5%]">
        
        {/* Floating Overlapping Avatar Group (Kids) */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center -space-x-3.5">
            <img 
              src="/kid_avatar.png" 
              alt="Boy avatar in yellow polo shirt" 
              className="w-12 h-12 rounded-full border-2 border-black/80 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform" 
            />
            <img 
              src="/kid_avatar2.png" 
              alt="Girl avatar with braided hair" 
              className="w-12 h-12 rounded-full border-2 border-black/80 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform" 
            />
            <img 
              src="/kid_avatar3.png" 
              alt="Boy avatar with glasses" 
              className="w-12 h-12 rounded-full border-2 border-black/80 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform" 
            />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
            Loved by 12,000+ kids & families
          </span>
        </div>

        {/* Heading with Instrument Serif font */}
        <h1 
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 tracking-tight font-light leading-none"
        >
          Built for the curious
        </h1>

        {/* Container for input and subtitle */}
        <div className="max-w-xl w-full space-y-5">
          {/* Email input bar */}
          <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none outline-none text-white placeholder-white/40 text-sm md:text-base flex-1 min-w-0"
            />
            <button 
              className="bg-white hover:bg-white/90 text-black rounded-full p-3 transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
              aria-label="Subscribe"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Subtitle text */}
          <p className="text-white/60 text-xs md:text-sm leading-relaxed px-4 max-w-lg mx-auto">
            Stay updated with the latest news and insights. Subscribe to our newsletter today and never miss out on exciting updates.
          </p>

          {/* Manifesto button */}
          <div className="pt-2">
            <button className="liquid-glass rounded-full px-8 py-3 text-white text-xs md:text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer">
              Read our Manifesto
            </button>
          </div>
        </div>
      </main>

      {/* Social icons footer */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Instagram"
          className="liquid-glass rounded-full p-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <InstagramIcon size={20} />
        </a>
        <a 
          href="https://twitter.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Twitter"
          className="liquid-glass rounded-full p-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <TwitterIcon size={20} />
        </a>
        <a 
          href="https://asme.org" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Website"
          className="liquid-glass rounded-full p-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <Globe size={20} />
        </a>
      </footer>
    </div>
  );
}
