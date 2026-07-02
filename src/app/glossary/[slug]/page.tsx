import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getTermBySlug } from "@/lib/content";
import Link from "next/link";
import { ChevronRight, Shield, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { slug } = await params;
  const term = await getTermBySlug(slug);

  if (!term) {
    notFound();
  }

  const categoryLabel = term.category.toUpperCase();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-24 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link>
          <ChevronRight size={12} />
          <span className="text-[#aab2c5] font-semibold">{categoryLabel}</span>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-xs">{term.term}</span>
        </div>

        {/* Term Header */}
        <header className="mb-8 border-b border-white/5 pb-6">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider mb-4 ${
            term.category === "gst"
              ? "bg-[#4f7cff]/10 text-[#4f7cff] border-[#4f7cff]/20"
              : "bg-[#9a6bff]/10 text-[#9a6bff] border-[#9a6bff]/20"
          }`}>
            {term.category}
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            {term.term}
          </h1>
          <p className="text-sm sm:text-base text-white font-medium bg-white/5 border border-white/5 p-4 rounded-xl leading-relaxed">
            {term.definition}
          </p>
        </header>

        {/* Law Citation Box (if any) */}
        {term.sections && (
          <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5 text-xs text-[#aab2c5] mb-8">
            <Shield size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">Bare Law Reference:</span>{" "}
              {term.sections}
            </div>
          </div>
        )}

        {/* Explanation Body */}
        <article className="prose prose-invert max-w-none text-[#aab2c5] text-sm leading-relaxed flex flex-col gap-6">
          <h3 className="text-sm font-bold text-white mb-2">Detailed Explanation</h3>
          <div 
            dangerouslySetInnerHTML={{ __html: term.explanation }} 
            className="dynamic-content-body flex flex-col gap-6"
          />
        </article>

        {/* Key Takeaways */}
        {term.takeaways && term.takeaways.length > 0 && (
          <section className="mt-8 border-t border-white/5 pt-8">
            <h3 className="text-sm font-bold text-white mb-4">Key Takeaways</h3>
            <ul className="list-disc pl-4 flex flex-col gap-2 text-xs text-[#737c92]">
              {term.takeaways.map((takeaway: string, idx: number) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: takeaway }} />
              ))}
            </ul>
          </section>
        )}

        {/* Call to Actions */}
        <div className="mt-12 pt-6 border-t border-white/5">
          <Link
            href="/glossary"
            className="text-xs font-semibold text-[#aab2c5] hover:text-white transition-colors"
          >
            &larr; Back to all terms
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
