import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NumberIQ",
  robots: { index: false, follow: false },
};

export default function AsmeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
