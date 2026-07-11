"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  slot: string;
  format?: string;
  responsive?: string;
  className?: string;
  /** Layout for in-article or in-feed ads */
  layout?: string;
  layoutKey?: string;
}

/**
 * Generic AdSense unit — supports auto, rectangle, leaderboard, in-article formats.
 * Set NEXT_PUBLIC_ADSENSE_CLIENT in your environment variables.
 */
export function AdSenseUnit({
  slot,
  format = "auto",
  responsive = "true",
  className = "",
  layout,
  layoutKey,
}: AdSenseUnitProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ads blocked or not loaded yet
    }
  }, []);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-placeholder";

  return (
    <div className={`overflow-hidden flex justify-center text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      />
    </div>
  );
}

/**
 * Leaderboard banner (728×90) — ideal above the fold on tool & article pages.
 * Falls back to responsive on mobile.
 */
export function AdLeaderboard({ slot, className = "" }: { slot: string; className?: string }) {
  return (
    <AdSenseUnit
      slot={slot}
      format="auto"
      responsive="true"
      className={`w-full my-4 ${className}`}
    />
  );
}

/**
 * Medium Rectangle (300×250) — high-CTR placement after calculator results.
 */
export function AdRectangle({ slot, className = "" }: { slot: string; className?: string }) {
  return (
    <AdSenseUnit
      slot={slot}
      format="rectangle"
      responsive="false"
      className={`my-6 ${className}`}
    />
  );
}

/**
 * In-article ad — placed between article paragraphs.
 */
export function AdInArticle({ slot, className = "" }: { slot: string; className?: string }) {
  return (
    <AdSenseUnit
      slot={slot}
      format="fluid"
      layout="in-article"
      responsive="true"
      className={`my-8 ${className}`}
    />
  );
}
