import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { NodeEvent, RunDocument } from "./automation-nodes";

// Runs are stored in Postgres, but the console falls back to an in-memory store when the
// database is unreachable. Two reasons: there is no local Postgres in development, and a
// cold or sleeping database should not take a live demo down with it. Runs are short-lived
// progress records, so losing them on restart costs nothing.
//
// Caveat: on serverless the fallback is per-instance, so progress pings and status polls
// can land on different workers and disagree. That is strictly better than failing, but the
// database is still the real path — keep DATABASE_URL healthy in production.

export interface AutomationRunRecord {
  id: string;
  workflow: string;
  status: string;
  trigger: string;
  nodes: NodeEvent[];
  documents: RunDocument[];
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

const memory = new Map<string, AutomationRunRecord>();
let memoryOrder: string[] = [];

let usingFallback = false;
export const isUsingFallback = () => usingFallback;

function noteFallback(where: string, error: unknown) {
  if (!usingFallback) {
    console.warn(`Automation store falling back to memory (${where}):`, error);
  }
  usingFallback = true;
}

function toRecord(row: {
  id: string; workflow: string; status: string; trigger: string;
  nodes: unknown; documents: unknown; error: string | null;
  startedAt: Date; finishedAt: Date | null;
}): AutomationRunRecord {
  return {
    ...row,
    nodes: (row.nodes as NodeEvent[]) ?? [],
    documents: (row.documents as RunDocument[]) ?? [],
  };
}

function remember(run: AutomationRunRecord) {
  memory.set(run.id, run);
  memoryOrder = [run.id, ...memoryOrder.filter(id => id !== run.id)].slice(0, 25);
  for (const id of memory.keys()) {
    if (!memoryOrder.includes(id)) memory.delete(id);
  }
}

export async function createRun(trigger: string): Promise<AutomationRunRecord> {
  try {
    return toRecord(await prisma.automationRun.create({ data: { trigger } }));
  } catch (error) {
    noteFallback("createRun", error);
    const run: AutomationRunRecord = {
      id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      workflow: "ca-inbox-autopilot",
      status: "running",
      trigger,
      nodes: [],
      documents: [],
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    };
    remember(run);
    return run;
  }
}

export async function getRun(id: string): Promise<AutomationRunRecord | null> {
  if (id.startsWith("mem_")) return memory.get(id) ?? null;
  try {
    const row = await prisma.automationRun.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  } catch (error) {
    noteFallback("getRun", error);
    return memory.get(id) ?? null;
  }
}

export async function getLatestRun(): Promise<AutomationRunRecord | null> {
  try {
    const row = await prisma.automationRun.findFirst({ orderBy: { startedAt: "desc" } });
    if (row) return toRecord(row);
  } catch (error) {
    noteFallback("getLatestRun", error);
  }
  const id = memoryOrder[0];
  return id ? memory.get(id) ?? null : null;
}

export async function updateRun(
  id: string,
  patch: Partial<Pick<AutomationRunRecord, "status" | "error" | "finishedAt" | "nodes" | "documents">>
): Promise<void> {
  const existing = memory.get(id);
  if (existing) {
    remember({ ...existing, ...patch });
    return;
  }

  try {
    await prisma.automationRun.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.error !== undefined && { error: patch.error }),
        ...(patch.finishedAt !== undefined && { finishedAt: patch.finishedAt }),
        ...(patch.nodes !== undefined && {
          nodes: patch.nodes as unknown as Prisma.InputJsonValue,
        }),
        ...(patch.documents !== undefined && {
          documents: patch.documents as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    noteFallback("updateRun", error);
  }
}
