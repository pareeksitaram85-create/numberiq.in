import { MetadataRoute } from "next";
import { getPosts, getTerms, isGlossaryTermIndexable } from "@/lib/content";
import { toolContent } from "@/lib/tool-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = "https://numberiq.in";

  // Static routes.
  // /universe is deliberately absent: the page is a shell around an iframed
  // canvas app and renders ~26 crawlable words, so submitting it advertises an
  // empty page. It is marked noindex at the route instead.
  const staticRoutes = [
    "",
    "/tools",
    "/pricing",
    "/insights",
    "/glossary",
    "/updates",
    "/about",
    "/contact",
    "/privacy-policy",
    "/disclaimer",
  ].map((route) => ({
    url: `${domain}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : route === "/tools" ? 0.95 : route === "/pricing" ? 0.9 : 0.8,
  }));

  // Dynamic calculator slugs
  const calculatorSlugs = [
    "notice-drafting-studio",
    "invoice-to-tally",
    "gst-late-fee-calculator",
    "gst-interest-calculator",
    "itc-utilization-calculator",
    "gst-reco-studio-ims-fixed",
    "invoice-compliance",
    "hsn-sac-finder",
    "income-tax-calculator-fy2026-27",
    "advance-tax-calculator",
    "interest-234abc-calculator",
    "capital-gains-tax-calculator",
    "numberiq-tds-chart-fy2026-27",
    "tds-interest-calculator",
    "msme-payment-tracker-calculator",
    "depreciation-block-assets-calculator",
    "lrs-tcs-calculator",
    "due-date-calendar",
    "section-mapper-1961-to-2025",
    "tds-tcs-form-mapper-2026",
    "gstin-validator",
    "presumptive-tax-optimiser",
    "litigation-cost-calculator",
    "statutory-time-machine",
    "appeal-deadline-calculator",
    "section-270aa-immunity",
    "gemini-invoice-reader",
    "rcm-applicability-checker",
    "tds-rate-finder",
  ];

  const practiceSlugList = ["transfer-pricing", "international-tax", "fema", "tax-audit"];
  const practiceRoutes = [
    {
      url: `${domain}/practice`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...practiceSlugList.map((slug) => ({
      url: `${domain}/practice/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];

  // These two have hand-written route files of their own under app/tools/<slug>/,
  // so they carry their content directly rather than through tool-content.tsx.
  const dedicatedToolPages = new Set(["gst-interest-calculator", "gemini-invoice-reader"]);

  // Everything else on the /tools/[slug] route needs an entry in tool-content.tsx
  // to render its prose, worked example and FAQs. Without one the page is a bare
  // calculator shell, so it is left out here and marked noindex on the route.
  const calculatorRoutes = calculatorSlugs
    .filter((slug) => dedicatedToolPages.has(slug) || Boolean(toolContent[slug]))
    .map((slug) => ({
      url: `${domain}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  // Dynamic posts
  const posts = await getPosts();
  const postRoutes = posts.map((post: { slug: string; createdAt: Date | string }) => ({
    url: `${domain}/insights/${post.slug}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic terms — stub-length entries are excluded; they carry a matching
  // noindex on the route itself. They re-enter here once expanded past
  // GLOSSARY_MIN_INDEXABLE_WORDS.
  const terms = await getTerms();
  const termRoutes = terms
    .filter(isGlossaryTermIndexable)
    .map((term: { slug: string }) => ({
      url: `${domain}/glossary/${term.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticRoutes, ...practiceRoutes, ...calculatorRoutes, ...postRoutes, ...termRoutes];
}
