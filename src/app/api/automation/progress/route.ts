import { NextResponse } from "next/server";
import { getRun, updateRun } from "@/lib/automation-store";
import { requireAutomationKey } from "@/lib/automation-auth";
import { createErrorResponse } from "@/lib/api-handler";
import { NODE_KEYS } from "@/lib/automation-nodes";

// n8n pings this after each node so the canvas can light up. Appends rather than replaces,
// so a ping arriving out of order cannot erase earlier progress.

const STATUSES = ["waiting", "running", "done", "failed"] as const;

export async function POST(req: Request) {
  const denied = requireAutomationKey(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { runId, node, status, detail, document, finished, error } = body;

    if (!runId) {
      return createErrorResponse("bad_request", "Missing runId", 400);
    }

    const run = await getRun(runId);
    if (!run) {
      return createErrorResponse("not_found", "Unknown runId", 404);
    }

    const nodes = [...run.nodes];
    const documents = [...run.documents];

    if (node) {
      if (!NODE_KEYS.includes(node)) {
        return createErrorResponse("bad_request", `Unknown node "${node}"`, 400);
      }
      if (status && !STATUSES.includes(status)) {
        return createErrorResponse("bad_request", `Unknown status "${status}"`, 400);
      }
      nodes.push({
        key: node,
        status: status ?? "done",
        detail: detail ? String(detail).slice(0, 300) : undefined,
        at: new Date().toISOString(),
      });
    }

    if (document?.fileName) {
      documents.push({
        fileName: String(document.fileName).slice(0, 200),
        docType: document.docType,
        label: document.label ? String(document.label).slice(0, 80) : undefined,
        driveUrl: document.driveUrl ? String(document.driveUrl).slice(0, 500) : undefined,
        error: document.error ? String(document.error).slice(0, 300) : undefined,
      });
    }

    const isFinished = Boolean(finished);
    await updateRun(runId, {
      nodes,
      documents,
      ...(isFinished && {
        status: error ? "failed" : "done",
        finishedAt: new Date(),
        ...(error && { error: String(error).slice(0, 1000) }),
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error recording automation progress:", err);
    return createErrorResponse("progress_failed", (err instanceof Error ? err.message : "") || "Failed to record progress", 500);
  }
}
