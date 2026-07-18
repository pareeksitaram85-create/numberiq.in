import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — NumberIQ",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
