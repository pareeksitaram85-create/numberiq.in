import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRun, updateRun } from "@/lib/automation-store";
import { createErrorResponse } from "@/lib/api-handler";

// The Run Now button. Called from the browser, so it is gated on an admin session rather
// than the automation key — that secret must never reach the client. This route holds it
// server-side and hands it to n8n, which uses it to call back into NumberIQ.

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return createErrorResponse("unauthorized", "Admin sign-in required to start a run.", 401);
  }

  const webhook = process.env.N8N_WEBHOOK_URL;
  if (!webhook) {
    return createErrorResponse("not_configured", "N8N_WEBHOOK_URL is not set.", 503);
  }

  const run = await createRun("manual");

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: run.id,
        callbackUrl: `${process.env.NEXTAUTH_URL || ""}/api/automation/progress`,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`n8n responded ${res.status}`);
  } catch (error) {
    const message = (error instanceof Error ? error.message : "") || "Could not reach the n8n workflow.";
    await updateRun(run.id, { status: "failed", error: message, finishedAt: new Date() });
    return createErrorResponse("workflow_unreachable", message, 502);
  }

  return NextResponse.json({ success: true, runId: run.id });
}
