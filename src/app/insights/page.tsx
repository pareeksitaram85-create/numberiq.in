import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getPosts } from "@/lib/content";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, Calendar } from "lucide-react";

export default async function InsightsIndex() {
  const posts = await getPosts();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Page Header */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Finance & Tax Insights
          </h1>
          <p className="text-sm text-[#aab2c5] max-w-xl leading-relaxed">
            Chartered Accountant-reviewed guides covering compliance, updates, and strategic tax planning under Indian laws.
          </p>
        </div>

        {/* Blog feed list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <article
              key={post.slug}
              className="border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15 p-6 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center gap-2 mb-4 text-[10px] uppercase font-bold tracking-wider">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    post.category === "gst" 
                      ? "bg-blue-primary/10 text-blue-primary border-blue-primary/20" 
                      : "bg-violet-primary/10 text-violet-primary border-violet-primary/20"
                  }`}>
                    {post.category}
                  </span>
                  <span className="text-[#737c92] flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#4f7cff] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-[#737c92] leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <Link
                href={`/insights/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#aab2c5] group-hover:text-white transition-colors cursor-pointer"
              >
                Read Article
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
