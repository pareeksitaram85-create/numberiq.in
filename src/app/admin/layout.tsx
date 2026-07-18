import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: the page component also checks the session client-side,
  // but that only affects rendering — this guarantees non-admins never receive
  // the admin UI payload at all.
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }
  return <>{children}</>;
}
