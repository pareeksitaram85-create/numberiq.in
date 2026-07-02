import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getTerms } from "@/lib/content";
import Link from "next/link";
import { ArrowRight, Search, BookOpen } from "lucide-react";

export default async function GlossaryIndex() {
  const terms = await getTerms();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Page Header */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Tax & Finance Glossary
          </h1>
          <p className="text-sm text-[#aab2c5] max-w-xl leading-relaxed">
            Essential terminology, legal definitions, and explanations u/s CGST Rules and Income Tax Acts.
          </p>
        </div>

        {/* Glossary Terms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terms.map((t: any) => (
            <div
              key={t.slug}
              className="border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15 p-6 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                <span className="inline-block text-[9px] font-bold text-[#4f7cff] bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2 py-0.5 rounded-full uppercase tracking-wider mb-3">
                  {t.category}
                </span>
                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#4f7cff] transition-colors">
                  {t.term}
                </h3>
                <p className="text-xs text-[#737c92] leading-relaxed mb-6 line-clamp-3">
                  {t.definition}
                </p>
              </div>

              <Link
                href={`/glossary/${t.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/5 text-[#aab2c5] group-hover:bg-[#4f7cff] group-hover:text-white justify-center transition-all cursor-pointer"
              >
                View Definition
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
