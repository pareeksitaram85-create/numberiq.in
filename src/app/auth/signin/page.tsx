"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Try email: admin@numberiq.in, password: admin123");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#05060a] px-6">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#4f7cff]/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-sm border border-white/5 bg-white/5 p-8 rounded-3xl backdrop-blur-md flex flex-col gap-6 relative z-10">
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white inline-block mb-2 hover:opacity-90 transition-opacity">
            NumberIQ
          </Link>
          <p className="text-xs text-[#737c92]">Access your unified finance workspace.</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@numberiq.in"
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#737c92] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#737c92] transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-[11px] text-[#ff5d73] bg-[#ff5d73]/10 border border-[#ff5d73]/20 px-3 py-2 rounded-lg leading-snug">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] disabled:bg-[#4f7cff]/50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(79,124,255,0.2)] cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In with Credentials"}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-[#737c92]">or</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Notice */}
        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2 text-[10px] text-[#737c92] leading-normal">
          <Shield size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <span>
            Testing? Use the demo credentials:<br />
            <b>Email:</b> admin@numberiq.in<br />
            <b>Password:</b> admin123
          </span>
        </div>
      </div>
    </div>
  );
}
