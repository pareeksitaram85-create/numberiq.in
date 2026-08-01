"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Mail,
  Inbox,
  Repeat,
  Sparkles,
  GitBranch,
  FileSpreadsheet,
  Scale,
  FileText,
  HardDrive,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { AUTOMATION_NODES, type NodeStatus, type RunDocument } from "@/lib/automation-nodes";

// A read-only twin of the n8n canvas. n8n remains the place the workflow is edited; this is
// the screen that shows it running, so a room can watch the pipeline light up node by node.

const ICONS: Record<string, React.ElementType> = {
  trigger: Play,
  gmail: Mail,
  loop: Repeat,
  classify: Sparkles,
  switch: GitBranch,
  invoice: FileSpreadsheet,
  notice: Scale,
  other: FileText,
  drive: HardDrive,
  summary: Send,
};

interface CanvasNode {
  key: string;
  label: string;
  sub: string;
  branch?: "invoice" | "notice" | "other";
  accent: string;
  status: NodeStatus;
  detail?: string;
}

interface RunState {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  nodes: CanvasNode[];
  documents: RunDocument[];
  counts: { total: number; invoices: number; notices: number; other: number; failed: number };
}

const IDLE_NODES: CanvasNode[] = AUTOMATION_NODES.map(n => ({ ...n, status: "waiting" }));

// Grid positions: the three branch nodes stack vertically in the same column.
const COLUMN: Record<string, number> = {
  trigger: 0, gmail: 1, loop: 2, classify: 3, switch: 4,
  invoice: 5, notice: 5, other: 5, drive: 6, summary: 7,
};
const ROW: Record<string, number> = {
  trigger: 1, gmail: 1, loop: 1, classify: 1, switch: 1,
  invoice: 0, notice: 1, other: 2, drive: 1, summary: 1,
};

const NODE_W = 176;
const NODE_H = 84;
const GAP_X = 72;
const GAP_Y = 28;
const CANVAS_W = 8 * NODE_W + 7 * GAP_X;
const CANVAS_H = 3 * NODE_H + 2 * GAP_Y;

const posOf = (key: string) => ({
  x: COLUMN[key] * (NODE_W + GAP_X),
  y: ROW[key] * (NODE_H + GAP_Y),
});

const EDGES: [string, string][] = [
  ["trigger", "gmail"], ["gmail", "loop"], ["loop", "classify"], ["classify", "switch"],
  ["switch", "invoice"], ["switch", "notice"], ["switch", "other"],
  ["invoice", "drive"], ["notice", "drive"], ["other", "drive"],
  ["drive", "summary"],
];

// n8n keeps each node in its own brand colour and signals run state with a ring around it,
// rather than repainting the node. Same idea here, so the canvas reads as the same diagram
// whether it is idle or mid-run.
const STATUS_RING: Record<NodeStatus, string> = {
  waiting: "#d5dae2",
  running: "#4f7cff",
  done: "#0f9d58",
  failed: "#ef4444",
};

const EDGE_STROKE: Record<NodeStatus, string> = {
  waiting: "#c9cfda",
  running: "#4f7cff",
  done: "#0f9d58",
  failed: "#ef4444",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  waiting: "Waiting",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

function curve(from: string, to: string) {
  const a = posOf(from);
  const b = posOf(to);
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

export function CAInboxAutopilot() {
  const [nodes, setNodes] = useState<CanvasNode[]>(IDLE_NODES);
  const [run, setRun] = useState<RunState | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async (runId?: string) => {
    try {
      const res = await fetch(`/api/automation/status${runId ? `?runId=${runId}` : ""}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.run) return;
      setRun(json.run);
      setNodes(json.run.nodes);
      if (json.run.status !== "running") stopPolling();
    } catch {
      // a dropped poll is not worth surfacing — the next tick will catch up
    }
  }, [stopPolling]);

  // Show the most recent run on load, so the page is never a blank canvas on stage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/automation/status");
        if (cancelled || !res.ok) return;
        const json = await res.json();
        if (cancelled || !json.run) return;
        setRun(json.run);
        setNodes(json.run.nodes);
      } catch {
        // nothing to show yet — the canvas stays idle
      }
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [stopPolling]);

  const startRun = async () => {
    setStarting(true);
    setError("");
    setNodes(IDLE_NODES);
    setRun(null);
    try {
      const res = await fetch("/api/automation/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Could not start the workflow.");
      }
      stopPolling();
      poll(json.runId);
      pollRef.current = setInterval(() => poll(json.runId), 2000);
    } catch (e) {
      setError((e instanceof Error ? e.message : "") || "Could not start the workflow.");
    } finally {
      setStarting(false);
    }
  };

  const statusOf = (key: string) => nodes.find(n => n.key === key)?.status ?? "waiting";
  const isRunning = run?.status === "running" || starting;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">CA Inbox Autopilot</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Reads the day&apos;s email attachments, sorts them with AI, files them into Google Drive,
            turns invoices into a Tally-ready register and drafts replies to notices. The workflow
            runs in n8n; the thinking happens in NumberIQ.
          </p>
        </div>
        <button
          onClick={startRun}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Running…" : "Run Now"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="overflow-x-auto rounded-xl border border-slate-200 bg-[#f7f8fb] p-8 dark:border-slate-800 dark:bg-slate-950"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(120,130,150,0.28) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={CANVAS_W}
            height={CANVAS_H}
            aria-hidden="true"
          >
            <defs>
              {(["waiting", "running", "done", "failed"] as NodeStatus[]).map(s => (
                <marker
                  key={s}
                  id={`arrow-${s}`}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 7 4 L 0 7 z" fill={EDGE_STROKE[s]} />
                </marker>
              ))}
            </defs>
            {EDGES.map(([from, to]) => {
              const reached = statusOf(from) === "done";
              const s: NodeStatus = reached && statusOf(to) !== "waiting" ? statusOf(to) : "waiting";
              return (
                <path
                  key={`${from}-${to}`}
                  d={curve(from, to)}
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  stroke={EDGE_STROKE[s]}
                  markerEnd={`url(#arrow-${s})`}
                  strokeDasharray={statusOf(to) === "running" ? "7 7" : undefined}
                >
                  {statusOf(to) === "running" && (
                    <animate attributeName="stroke-dashoffset" from="28" to="0" dur="0.7s" repeatCount="indefinite" />
                  )}
                </path>
              );
            })}
          </svg>

          {nodes.map(node => {
            const Icon = ICONS[node.key] ?? FileText;
            const { x, y } = posOf(node.key);
            const ring = STATUS_RING[node.status];
            return (
              <motion.div
                key={node.key}
                title={`${node.label} — ${STATUS_LABEL[node.status]}`}
                className="absolute flex flex-col justify-center rounded-2xl bg-white px-3 py-2.5 dark:bg-slate-900"
                style={{
                  left: x,
                  top: y,
                  width: NODE_W,
                  height: NODE_H,
                  border: `2px solid ${ring}`,
                  boxShadow:
                    node.status === "waiting"
                      ? "0 1px 2px rgba(16,24,40,0.06)"
                      : `0 0 0 4px ${ring}22, 0 4px 12px rgba(16,24,40,0.10)`,
                }}
                animate={node.status === "running" ? { scale: [1, 1.035, 1] } : { scale: 1 }}
                transition={
                  node.status === "running"
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.25 }
                }
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${node.accent}1f`, color: node.accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                      {node.label}
                    </span>
                    <span className="block truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                      {node.detail || node.sub}
                    </span>
                  </span>
                  {node.status === "done" && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: ring }} />}
                  {node.status === "failed" && <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: ring }} />}
                  {node.status === "running" && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: ring }} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        {(["waiting", "running", "done", "failed"] as NodeStatus[]).map(s => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_RING[s] }}
            />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {run && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Attachments", value: run.counts.total },
            { label: "Invoices", value: run.counts.invoices },
            { label: "Notices", value: run.counts.notices },
            { label: "Other", value: run.counts.other },
            { label: "Failed", value: run.counts.failed },
          ].map(c => (
            <div
              key={c.label}
              className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-2xl font-semibold tabular-nums">{c.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {run && run.documents.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-800">
            Documents processed
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {run.documents.map((d, i) => (
              <li key={`${d.fileName}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {d.error ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <span className="min-w-0 flex-1 truncate">{d.fileName}</span>
                {d.docType && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {d.docType}
                  </span>
                )}
                {d.error ? (
                  <span className="shrink-0 text-xs text-red-600">{d.error}</span>
                ) : d.driveUrl ? (
                  <a
                    href={d.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Open in Drive <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {run?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{run.error}</span>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Inbox className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Drafted replies and extracted invoice figures are produced by AI from a scan of the
          original document. Check every figure and date against the source before importing to
          Tally or filing a reply.
        </span>
      </div>
    </div>
  );
}
