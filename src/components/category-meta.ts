export interface CategoryMeta {
  label: string;
  tone: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  gst: { label: "GST", tone: "#4f7cff" },
  dt: { label: "Direct Tax", tone: "#34d399" },
  tds: { label: "TDS", tone: "#f4b740" },
  itx: { label: "International Tax", tone: "#38e1d6" },
  cmp: { label: "Compliance", tone: "#a855f7" },
};

export function categoryMeta(key: string): CategoryMeta {
  return CATEGORY_META[key?.toLowerCase()] ?? { label: key?.toUpperCase() ?? "Other", tone: "#737c92" };
}
