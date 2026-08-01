import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRun, getLatestRun } from "@/lib/automation-store";
import { createErrorResponse } from "@/lib/api-handler";
import { AUTOMATION_NODES, type NodeEvent, type NodeStatus } from "@/lib/automation-nodes";

// Polled by the canvas every couple of seconds. Collapses the append-only event log into
// one current status per node, which is what the diagram actually renders.

const RANK: Record<NodeStatus, number> = { waiting: 0, running: 1, done: 2, failed: 3 };

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return createErrorResponse("unauthorized", "Admin sign-in required.", 401);
  }

  try {
    const runId = new URL(req.url).searchParams.get("runId");

    const run = runId ? await getRun(runId) : await getLatestRun();

    if (!run) {
      return NextResponse.json({ success: true, run: null });
    }

    const events: NodeEvent[] = run.nodes;
    const latest = new Map<string, NodeEvent>();
    for (const e of events) {
      const seen = latest.get(e.key);
      // failed wins over done; otherwise the furthest-along status sticks
      if (!seen || RANK[e.status] >= RANK[seen.status]) latest.set(e.key, e);
    }

    const nodes = AUTOMATION_NODES.map(n => ({
      ...n,
      status: latest.get(n.key)?.status ?? ("waiting" as NodeStatus),
      detail: latest.get(n.key)?.detail,
    }));

    const documents = run.documents;

    return NextResponse.json({
      success: true,
      run: {
        id: run.id,
        status: run.status,
        trigger: run.trigger,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        error: run.error,
        nodes,
        documents,
        counts: {
          total: documents.length,
          invoices: documents.filter(d => d.docType === "invoice").length,
          notices: documents.filter(d => d.docType === "notice").length,
          other: documents.filter(d => d.docType === "other").length,
          failed: documents.filter(d => d.error).length,
        },
      },
    });
  } catch (error) {
    console.error("Error reading automation status:", error);
    return createErrorResponse("status_failed", (error instanceof Error ? error.message : "") || "Failed to read run status", 500);
  }
}
