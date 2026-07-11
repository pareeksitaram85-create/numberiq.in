import { MetadataRoute } from "next";
import { getPosts, getTerms } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = "https://numberiq.in";

  // Static routes
  const staticRoutes = [
    "",
    "/tools",
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
    priority: route === "" ? 1.0 : route === "/tools" ? 0.95 : 0.8,
  }));

  // Dynamic calculator slugs
  const calculatorSlugs = [
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
  ];

  const calculatorRoutes = calculatorSlugs.map((slug) => ({
    url: `${domain}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Dynamic posts
  const posts = await getPosts();
  const postRoutes = posts.map((post: any) => ({
    url: `${domain}/insights/${post.slug}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic terms
  const terms = await getTerms();
  const termRoutes = terms.map((term: any) => ({
    url: `${domain}/glossary/${term.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...calculatorRoutes, ...postRoutes, ...termRoutes];
}
