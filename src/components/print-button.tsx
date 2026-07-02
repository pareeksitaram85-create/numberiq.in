"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-[#aab2c5] hover:text-white transition-all cursor-pointer"
    >
      <Printer size={12} />
      Print PDF
    </button>
  );
}
