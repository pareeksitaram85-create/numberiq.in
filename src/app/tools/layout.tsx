import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax Calculators & Compliance Tools for CAs | NumberIQ",
  description: "Browse our suite of free online financial calculators and utility tools for GST late fees, interest, MSME trackers, and Income Tax.",
  alternates: {
    canonical: "https://numberiq.in/tools",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
