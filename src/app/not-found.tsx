import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10 text-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tight">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-[#aab2c5]">
          Page Not Found
        </h2>
        <p className="text-sm md:text-base text-[#737c92] max-w-md leading-relaxed">
          The page you are looking for might have been moved, deleted, or does not exist.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-sm font-semibold text-white transition-all shadow-[0_0_20px_rgba(79,124,255,0.2)]"
        >
          Go Back Home
        </Link>
      </main>

      <Footer />
    </div>
  );
}
