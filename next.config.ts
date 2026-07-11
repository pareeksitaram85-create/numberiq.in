import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.supabase.co https://api.anthropic.com https://api.ocr.space https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://www.googleadservices.com https://pagead2.googlesyndication.com;
    worker-src 'self' blob:;
    frame-src 'self' https://googleads.g.doubleclick.net https://bid.g.doubleclick.net;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  async headers() {
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
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 1. Core pages redirects
      { source: "/tools.html", destination: "/tools", permanent: true },
      { source: "/glossary.html", destination: "/glossary", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/privacy.html", destination: "/privacy-policy", permanent: true },
      { source: "/privacy-policy.html", destination: "/privacy-policy", permanent: true },
      { source: "/disclaimer.html", destination: "/disclaimer", permanent: true },

      // 2. Explicit tools redirects (must load before catch-all slug.html)
      { source: "/GST_ReCO_Studio_IMS_FIXED.html", destination: "/tools/gst-reco-studio-ims-fixed", permanent: true },
      { source: "/HSN_SAC_Finder.html", destination: "/tools/hsn-sac-finder", permanent: true },
      { source: "/Invoice%20Compliance.html", destination: "/tools/invoice-compliance", permanent: true },
      { source: "/Invoice-Compliance.html", destination: "/tools/invoice-compliance", permanent: true },
      
      { source: "/tools/GST_ReCO_Studio_IMS_FIXED", destination: "/tools/gst-reco-studio-ims-fixed", permanent: true },
      { source: "/tools/gst_reco_studio_ims_fixed", destination: "/tools/gst-reco-studio-ims-fixed", permanent: true },
      { source: "/tools/HSN_SAC_Finder", destination: "/tools/hsn-sac-finder", permanent: true },
      { source: "/tools/hsn_sac_finder", destination: "/tools/hsn-sac-finder", permanent: true },
      // NOTE: "/tools/Invoice-Compliance" redirect REMOVED — Next.js redirect
      // matching is case-insensitive, so it also matched the lowercase
      // destination itself, causing an infinite 308 redirect loop that made
      // the tool page unreachable. The page handles casing via slug.toLowerCase().
      { source: "/advance-tax-calculator.html", destination: "/tools/advance-tax-calculator", permanent: true },
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
      // NOTE: /tools/:slug.html redirect REMOVED — actual calculator files live
      // in public/tools/*.html, and redirects run BEFORE static files, which
      // caused an infinite loop (Launch button redirected back to wrapper page).
      { source: "/glossary/:term.html", destination: "/glossary/:term", permanent: true },
      { source: "/insights/:slug.html", destination: "/insights/:slug", permanent: true },

      // 4. Catch-all for root level articles (to map to /insights/slug)
      { source: "/:slug.html", destination: "/insights/:slug", permanent: true },

      // 5. Marketplace & Boardroom pages removed — modules now live in /dashboard
      { source: "/marketplace", destination: "/dashboard", permanent: false },
      { source: "/module", destination: "/dashboard", permanent: false },

      // 6. Duplicate content: /tax-tools is a near-duplicate listing of /tools
      // (same calculators, near-identical meta) with zero internal links —
      // consolidate into the one page that's actually in the navbar.
      { source: "/tax-tools", destination: "/tools", permanent: true }
    ];
  },
};

export default nextConfig;
