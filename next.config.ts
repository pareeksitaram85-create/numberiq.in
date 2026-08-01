import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Load seed data for explicit legacy root-level extensionless redirects
const legacyPostRedirects: Array<{ source: string; destination: string; permanent: boolean }> = [];
const legacyTermRedirects: Array<{ source: string; destination: string; permanent: boolean }> = [];

try {
  const seedPath = path.join(process.cwd(), "prisma", "seedData.json");
  if (fs.existsSync(seedPath)) {
    const raw = fs.readFileSync(seedPath, "utf8");
    const seedData = JSON.parse(raw);
    if (Array.isArray(seedData.posts)) {
      seedData.posts.forEach((p: { slug?: string }) => {
        if (p?.slug) {
          legacyPostRedirects.push({
            source: `/${p.slug}`,
            destination: `/insights/${p.slug}`,
            permanent: true,
          });
        }
      });
    }
    if (Array.isArray(seedData.terms)) {
      seedData.terms.forEach((t: { slug?: string }) => {
        if (t?.slug) {
          legacyTermRedirects.push({
            source: `/${t.slug}`,
            destination: `/glossary/${t.slug}`,
            permanent: true,
          });
        }
      });
    }
  }
} catch (e) {
  console.warn("Failed to load seedData.json for redirects in next.config.ts:", e);
}

const nextConfig: NextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com;`;

    const cspHeader = `
        default-src 'self';
        ${scriptSrc}
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://generativelanguage.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.supabase.co https://api.anthropic.com https://api.ocr.space https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://www.googleadservices.com https://pagead2.googlesyndication.com;
        worker-src 'self' blob:;
        frame-src 'self' https://googleads.g.doubleclick.net https://bid.g.doubleclick.net;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...legacyPostRedirects,
      ...legacyTermRedirects,
      // 1. Core structural renames & legacy moves
      { source: "/monetization", destination: "/pricing", permanent: true },
      { source: "/tools/pricing", destination: "/pricing", permanent: true },
      { source: "/compliance", destination: "/practice", permanent: true },

      // 2. Legacy HTML redirects for root calculators
      { source: "/advance-tax-calculator.html", destination: "/tools/advance-tax-calculator", permanent: true },
      { source: "/appeal-deadline-calculator.html", destination: "/tools/appeal-deadline-calculator", permanent: true },
      { source: "/capital-gains-tax-calculator.html", destination: "/tools/capital-gains-tax-calculator", permanent: true },
      { source: "/depreciation-block-assets-calculator.html", destination: "/tools/depreciation-block-assets-calculator", permanent: true },
      { source: "/due-date-calendar.html", destination: "/tools/due-date-calendar", permanent: true },
      { source: "/gst-interest-calculator.html", destination: "/tools/gst-interest-calculator", permanent: true },
      { source: "/gst-late-fee-calculator.html", destination: "/tools/gst-late-fee-calculator", permanent: true },
      { source: "/income-tax-calculator-fy2026-27.html", destination: "/tools/income-tax-calculator-fy2026-27", permanent: true },
      { source: "/interest-234abc-calculator.html", destination: "/tools/interest-234abc-calculator", permanent: true },
      { source: "/itc-utilization-calculator.html", destination: "/tools/itc-utilization-calculator", permanent: true },
      { source: "/lrs-tcs-calculator.html", destination: "/tools/lrs-tcs-calculator", permanent: true },
      { source: "/msme-payment-tracker-calculator.html", destination: "/tools/msme-payment-tracker-calculator", permanent: true },
      { source: "/numberiq-tds-chart-fy2026-27.html", destination: "/tools/numberiq-tds-chart-fy2026-27", permanent: true },
      { source: "/tds-interest-calculator.html", destination: "/tools/tds-interest-calculator", permanent: true },

      // 3. Sub-folder redirects
      { source: "/glossary/:term.html", destination: "/glossary/:term", permanent: true },
      { source: "/insights/:slug.html", destination: "/insights/:slug", permanent: true },

      // 4a. Specific root-level tool pages (must be before catch-all /:slug.html)
      { source: "/universe.html", destination: "/universe", permanent: true },
      { source: "/tools/universe", destination: "/universe", permanent: true },

      // 4. Catch-all for root level articles with .html
      { source: "/:slug.html", destination: "/insights/:slug", permanent: true },

      // 5. Marketplace & Boardroom pages removed — modules now live in /dashboard
      { source: "/marketplace", destination: "/dashboard", permanent: false },
      { source: "/module", destination: "/dashboard", permanent: false },

      // 6. Duplicate content: /tax-tools is a near-duplicate listing of /tools
      { source: "/tax-tools", destination: "/tools", permanent: true }
    ];
  },
};

export default nextConfig;
