import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { RecoveryForward } from "@/components/recovery-forward";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NumberIQ — Free Tax Calculators & Compliance Tools for CAs | India",
  description: "An integrated tax and compliance workspace for Chartered Accountants, corporate finance teams, and practitioners in India. Built by a CA, covering GST, TDS, and the new Income-tax Act 2025.",
  metadataBase: new URL("https://numberiq.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NumberIQ — Free Tax Calculators & Compliance Tools for CAs | India",
    description: "An integrated tax and compliance workspace for Chartered Accountants, corporate finance teams, and practitioners in India. Built by a CA, covering GST, TDS, and the new Income-tax Act 2025.",
    type: "website",
    url: "https://numberiq.in",
    siteName: "NumberIQ",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "NumberIQ — Finance Intelligence Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NumberIQ — Free Tax Calculators & Compliance Tools for CAs | India",
    description: "An integrated tax and compliance workspace for Chartered Accountants, corporate finance teams, and practitioners in India. Built by a CA, covering GST, TDS, and the new Income-tax Act 2025.",
    images: ["/og-cover.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-placeholder";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://numberiq.in/#organization",
                  "name": "NumberIQ",
                  "url": "https://numberiq.in",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://numberiq.in/favicon.png",
                    "caption": "NumberIQ Logo"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://numberiq.in/#website",
                  "url": "https://numberiq.in",
                  "name": "NumberIQ",
                  "publisher": {
                    "@id": "https://numberiq.in/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://numberiq.in/tools?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#05060a] text-[#eef1f8] font-sans">
        <RecoveryForward />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
