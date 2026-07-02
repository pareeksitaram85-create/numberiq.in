"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  slot: string;
  format?: string;
  responsive?: string;
  className?: string;
}

export function AdSenseUnit({ slot, format = "auto", responsive = "true", className = "" }: AdSenseUnitProps) {
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
    <div className={`my-6 overflow-hidden flex justify-center text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
