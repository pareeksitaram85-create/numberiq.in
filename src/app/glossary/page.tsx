import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getTerms } from "@/lib/content";
import { GlossaryIndexClient, type GlossaryItem } from "@/components/glossary-index-client";

export const metadata = {
  title: "Tax & Finance Glossary | NumberIQ",
  description: "Browse essential tax terminology, legal definitions, and explanations under GST rules and Indian Income Tax Acts.",
  alternates: {
    canonical: "https://numberiq.in/glossary",
  },
  openGraph: {
    title: "Tax & Finance Glossary | NumberIQ",
    description: "Browse essential tax terminology, legal definitions, and explanations under GST rules and Indian Income Tax Acts.",
    type: "website",
    url: "https://numberiq.in/glossary",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "NumberIQ Glossary",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tax & Finance Glossary | NumberIQ",
    description: "Browse essential tax terminology, legal definitions, and explanations under GST rules and Indian Income Tax Acts.",
    images: ["/og-cover.png"],
  },
};

export default async function GlossaryIndex() {
  const terms = await getTerms();

  const items: GlossaryItem[] = terms.map((t) => ({
    slug: t.slug,
    term: t.term,
    category: t.category,
    definition: t.definition,
  }));

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#f4b740]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[45%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#4f7cff]/4 blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <GlossaryIndexClient terms={items} />

      <Footer />
    </div>
  );
}
