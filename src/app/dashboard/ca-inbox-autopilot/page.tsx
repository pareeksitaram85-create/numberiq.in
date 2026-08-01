import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CAInboxAutopilot } from "@/components/calculators/ca-inbox-autopilot";

// Boardroom module, not a public tool: the console can trigger a run that reads a mailbox
// and writes to Drive, so the page itself is gated rather than relying on the API alone.

export const metadata: Metadata = {
  title: "CA Inbox Autopilot | NumberIQ Dashboard",
  description: "Email → Drive → Tally automation console.",
  robots: { index: false, follow: false },
};

export default async function CAInboxAutopilotPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/ca-inbox-autopilot");
  }

  if (session.user.role !== "ADMIN") {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">Access restricted</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            The CA Inbox Autopilot console is limited to administrators. Ask the workspace
            owner to grant you access.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={12} />
          <span className="text-slate-700 dark:text-slate-300">CA Inbox Autopilot</span>
        </nav>
        <CAInboxAutopilot />
      </main>
      <Footer />
    </>
  );
}
