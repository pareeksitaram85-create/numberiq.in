import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.supabase.co https://api.anthropic.com https://api.ocr.space https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com;
    worker-src 'self' blob:;
    frame-src 'self';
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
            value: "origin-when-cross-origin",
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
      { source: "/numberiq-tds-chart-fy2026-27.html", destination: "/tools/numberiq-tds-chart-fy2026-27", permanent: true },
      { source: "/tds-interest-calculator.html", destination: "/tools/tds-interest-calculator", permanent: true },

      // 3. Sub-folder redirects
      { source: "/tools/:slug.html", destination: "/tools/:slug", permanent: true },
      { source: "/glossary/:term.html", destination: "/glossary/:term", permanent: true },
      { source: "/insights/:slug.html", destination: "/insights/:slug", permanent: true },

      // 4. Catch-all for root level articles (to map to /insights/slug)
      { source: "/:slug.html", destination: "/insights/:slug", permanent: true }
    ];
  },
};

export default nextConfig;
