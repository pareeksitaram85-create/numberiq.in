// The canvas and the n8n workflow must agree on the node list and its order. This is the
// single definition of both — n8n reports progress using these keys.

export interface AutomationNode {
  key: string;
  label: string;
  sub: string;
  /** Which branch of the Switch this node belongs to, for canvas layout. */
  branch?: "invoice" | "notice" | "other";
  /** Brand accent, mirroring how n8n tints each integration on its own canvas. */
  accent: string;
}

export const AUTOMATION_NODES: AutomationNode[] = [
  { key: "trigger", label: "Trigger", sub: "Run Now / daily 07:00", accent: "#ff6d5a" },
  { key: "gmail", label: "Gmail", sub: "attachments, last 24h", accent: "#ea4335" },
  { key: "loop", label: "Each file", sub: "one at a time", accent: "#7d5fff" },
  { key: "classify", label: "Classify", sub: "NumberIQ · Gemini", accent: "#4f7cff" },
  { key: "switch", label: "Route", sub: "invoice / notice / other", accent: "#f5a623" },
  { key: "invoice", label: "Invoice → Tally", sub: "NumberIQ · Excel + XML", branch: "invoice", accent: "#0f9d58" },
  { key: "notice", label: "Notice → Reply", sub: "NumberIQ · draft", branch: "notice", accent: "#a66bff" },
  { key: "other", label: "File as-is", sub: "no processing", branch: "other", accent: "#8a94a6" },
  { key: "drive", label: "Google Drive", sub: "create folder, upload", accent: "#fbbc04" },
  { key: "summary", label: "Summary email", sub: "counts + links", accent: "#ea4335" },
];

export const NODE_KEYS = AUTOMATION_NODES.map(n => n.key);

export type NodeStatus = "waiting" | "running" | "done" | "failed";

export interface NodeEvent {
  key: string;
  status: NodeStatus;
  detail?: string;
  at: string;
}

export interface RunDocument {
  fileName: string;
  docType?: "invoice" | "notice" | "other";
  label?: string;
  driveUrl?: string;
  error?: string;
}
