import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getPostBySlug, getPosts } from "@/lib/content";
import Link from "next/link";
import { ChevronRight, Calendar, User, Clock, Share2 } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { AdLeaderboard, AdInArticle } from "@/components/adsense";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | NumberIQ",
    };
  }

  // Ensure title is under 60 chars (title + " | NumberIQ" is cleanTitle.length + 11 chars)
  const cleanTitle = post.title.length > 45 ? `${post.title.slice(0, 45)}...` : post.title;
  const description = post.excerpt
    ? (post.excerpt.length > 155 ? `${post.excerpt.slice(0, 152)}...` : post.excerpt)
    : `Read ${post.title} on NumberIQ, your finance and tax workspace.`;

  return {
    title: `${cleanTitle} | NumberIQ`,
    description: description,
    alternates: {
      canonical: `https://numberiq.in/insights/${slug}`,
    },
    openGraph: {
      title: `${cleanTitle} | NumberIQ`,
      description: description,
      type: "article",
      url: `https://numberiq.in/insights/${slug}`,
      images: [
        {
          url: "/og-cover.png",
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanTitle} | NumberIQ`,
      description: description,
      images: ["/og-cover.png"],
    },
  };
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const categoryLabel = post.category.toUpperCase();
  const allPosts = await getPosts();
  let relatedPosts = allPosts.filter((p: any) => p.category === post.category && p.slug !== post.slug);
  if (relatedPosts.length < 3) {
    const fallback = allPosts.filter((p: any) => p.slug !== post.slug && !relatedPosts.some((r: any) => r.slug === p.slug));
    relatedPosts = [...relatedPosts, ...fallback].slice(0, 3);
  } else {
    relatedPosts = relatedPosts.slice(0, 3);
  }

  const schemaGraph: any[] = [
    {
      "@type": "Article",
      "@id": `https://numberiq.in/insights/${slug}#article`,
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt || post.createdAt,
      "author": {
        "@type": "Person",
        "name": "CA Sitaram Pareek",
        "honorificPrefix": "CA",
        "jobTitle": "Chartered Accountant",
        "description": "Chartered Accountant (ICAI) with a Diploma in International Taxation (DIIT-ICAI), specialising in GST, direct tax, transfer pricing and cross-border taxation for businesses operating across India, the UAE and Singapore.",
        "url": "https://numberiq.in/about",
        "knowsAbout": ["GST", "Income Tax", "Transfer Pricing", "DTAA", "FEMA", "International Taxation"],
        "worksFor": {
          "@type": "Organization",
          "name": "NumberIQ"
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "NumberIQ",
        "logo": {
          "@type": "ImageObject",
          "url": "https://numberiq.in/favicon.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://numberiq.in/insights/${slug}`
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": `https://numberiq.in/insights/${slug}#breadcrumb`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Insights",
          "item": "https://numberiq.in/insights"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": post.title,
          "item": `https://numberiq.in/insights/${slug}`
        }
      ]
    }
  ];

  if (post.faq && Array.isArray(post.faq) && post.faq.length > 0) {
    schemaGraph.push({
      "@type": "FAQPage",
      "@id": `https://numberiq.in/insights/${slug}#faq`,
      "mainEntity": post.faq.map((item: any) => ({
        "@type": "Question",
        "name": item.name || item.question || "",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.acceptedAnswer?.text || item.answer || ""
        }
      }))
    });
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": schemaGraph
          })
        }}
      />

      <main className="flex-1 pt-24 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/insights" className="hover:text-white transition-colors">Insights</Link>
          <ChevronRight size={12} />
          <span className="text-[#aab2c5] font-semibold">{categoryLabel}</span>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-xs">{post.title}</span>
        </div>

        {/* Leaderboard Ad — high visibility above article header */}
        <AdLeaderboard slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD || "3974343520"} className="mb-6" />

        {/* Article Header */}
        <header className="mb-8">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-4 ${post.category === "gst"
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

        {/* In-Article Ad — after prose body, high attention zone */}
        <AdInArticle slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE || "3974343520"} />

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

        {/* Related Topics Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 border-t border-white/5 pt-12">
            <h2 className="font-display text-lg font-bold text-white mb-6">Related Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.slug}
                  href={`/insights/${related.slug}`}
                  className="group flex flex-col p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
                >
                  <span className="text-[9px] font-bold text-[#4f7cff] uppercase tracking-wider mb-2">
                    {related.category}
                  </span>
                  <h3 className="text-xs font-bold text-white group-hover:text-[#4f7cff] transition-colors line-clamp-2 leading-snug">
                    {related.title}
                  </h3>
                  <p className="text-[10px] text-[#737c92] line-clamp-2 mt-2 leading-relaxed">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Author Bio — E-E-A-T */}
        <section className="mt-12 border border-white/10 bg-white/5 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-[#4f7cff] to-[#9a6bff] flex items-center justify-center font-display font-bold text-white text-lg">
            SP
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold mb-1">Written &amp; reviewed by</p>
            <h3 className="text-sm font-bold text-white mb-2">CA Sitaram Pareek</h3>
            <p className="text-xs text-[#aab2c5] leading-relaxed mb-3">
              Chartered Accountant (ICAI) and holder of the Diploma in International Taxation (DIIT-ICAI).
              Works in-house with a multinational group operating across India, the UAE and Singapore, handling
              GST compliance, direct tax, transfer pricing, DTAA advisory and FEMA matters. Every article on
              NumberIQ is written against the bare Act, current CBDT/CBIC notifications and official portals
              (incometax.gov.in, gst.gov.in, cbic.gov.in).
            </p>
            <Link href="/about" className="text-xs font-semibold text-[#4f7cff] hover:text-white transition-colors">
              About NumberIQ &rarr;
            </Link>
          </div>
        </section>

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
