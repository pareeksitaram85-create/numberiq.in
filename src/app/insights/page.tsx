import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getPosts } from "@/lib/content";
import { InsightsIndexClient, type InsightItem } from "@/components/insights-index-client";

export const metadata = {
  title: "Finance & Tax Insights | NumberIQ",
  description: "Read Chartered Accountant-reviewed guides and deep-dives covering compliance, tax updates, and strategic tax planning under Indian laws.",
  alternates: {
    canonical: "https://numberiq.in/insights",
  },
  openGraph: {
    title: "Finance & Tax Insights | NumberIQ",
    description: "Read Chartered Accountant-reviewed guides and deep-dives covering compliance, tax updates, and strategic tax planning under Indian laws.",
    type: "website",
    url: "https://numberiq.in/insights",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "NumberIQ Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance & Tax Insights | NumberIQ",
    description: "Read Chartered Accountant-reviewed guides and deep-dives covering compliance, tax updates, and strategic tax planning under Indian laws.",
    images: ["/og-cover.png"],
  },
};

export default async function InsightsIndex() {
  const posts = await getPosts();

  const items: InsightItem[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    readingTime: p.readingTime ?? null,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#34d399]/4 blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <InsightsIndexClient posts={items} />

      <Footer />
    </div>
  );
}
