import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans — SaaS Subscriptions for Tax Professionals | NumberIQ",
  description: "Explore NumberIQ premium subscription tiers. Select the Pro plan for unlimited AI notice drafting, advanced tax advisor access, and CA boardroom tools.",
  alternates: {
    canonical: "https://numberiq.in/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
