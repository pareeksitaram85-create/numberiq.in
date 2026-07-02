import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getPostBySlug } from "@/lib/content";
import Link from "next/link";
import { ChevronRight, Calendar, User, Clock, Share2 } from "lucide-react";
import { PrintButton } from "@/components/print-button";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const categoryLabel = post.category.toUpperCase();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-24 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/insights" className="hover:text-white transition-colors">Insights</Link>
          <ChevronRight size={12} />
          <span className="text-[#aab2c5] font-semibold">{categoryLabel}</span>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-xs">{post.title}</span>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-4 ${
            post.category === "gst"
              ? "bg-[#4f7cff]/10 text-[#4f7cff] border-[#4f7cff]/20"
              : "bg-[#9a6bff]/10 text-[#9a6bff] border-[#9a6bff]/20"
          }`}>
            {post.category}
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#737c92] border-y border-white/5 py-3">
            <span className="flex items-center gap-1 text-[#aab2c5]">
              <User size={12} />
              {post.authorName}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10 hidden sm:inline" />
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Last reviewed {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10 hidden sm:inline" />
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readingTime}
            </span>
          </div>
        </header>

        {/* Prose Body */}
        <article className="prose prose-invert max-w-none text-[#aab2c5] text-sm leading-relaxed flex flex-col gap-6">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            className="dynamic-content-body flex flex-col gap-6"
          />
        </article>

        {/* FAQ Schema Accordion */}
        {post.faq && Array.isArray(post.faq) && (
          <section className="mt-12 border-t border-white/5 pt-12">
            <h2 className="font-display text-lg font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-4">
              {post.faq.map((item: any, idx: number) => (
                <div key={idx} className="border border-white/5 bg-white/5 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-white mb-2">{item.name}</h4>
                  <p className="text-xs text-[#737c92] leading-relaxed">{item.acceptedAnswer?.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Actions */}
        <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
          <Link
            href="/insights"
            className="text-xs font-semibold text-[#aab2c5] hover:text-white transition-colors"
          >
            &larr; Back to all articles
          </Link>
          <div className="flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
