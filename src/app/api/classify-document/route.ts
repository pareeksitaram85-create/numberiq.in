import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { requireAutomationKey } from "@/lib/automation-auth";
import { createErrorResponse } from "@/lib/api-handler";
import { FOLDER_GUIDE, FOLDER_KEYS, folderByKey } from "@/lib/drive-folders";

// One Gemini call that both classifies an attachment and, when it is an invoice, extracts
// the same fields /api/extract-invoice returns. Combining the two halves latency and cost
// per document, which matters when the workflow sweeps a whole day's inbox.

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

const PROMPT = `You are sorting documents that arrived as email attachments at an Indian
chartered accountancy practice. Decide what this document is, where it should be filed, then
extract its details.

Answer TWO separate questions. Do not collapse them — a purchase invoice is filed under GST
but processed as an invoice.

QUESTION 1 — "folder": where does it get filed? Exactly one of:
${FOLDER_GUIDE}

QUESTION 2 — "docType": what should be done with it? Exactly one of:
- "invoice"  — a tax invoice, bill, purchase invoice, debit/credit note, or receipt.
- "notice"   — anything issued BY a tax authority: GST notices (ASMT-10, DRC-01, DRC-07,
               REG-17), Income Tax notices (139(9), 143(1), 143(2), 148, 156, 245),
               TDS defaults, show-cause notices, assessment or penalty orders, appeal
               communications.
- "other"    — bank statements, ledgers, agreements, salary slips, marketing material,
               or anything that fits neither category.

Always fill: folder, docType, label, confidence.

"label" is a short filesystem-safe folder name, letters/digits/hyphens only, max 60 chars:
- invoice → INV-<invoice number>-<vendor name>, e.g. INV-1042-SharmaTraders
- notice  → NOTICE-<notice type>-<YYYY-MM-DD of the notice>, e.g. NOTICE-ASMT10-2026-07-20
- other   → OTHER-<short description>, e.g. OTHER-BankStatement

When docType is "invoice", also fill every invoice field:
1. date: invoice/bill date (prefer DD/MM/YYYY).
2. billNumber: invoice number, bill no, tax invoice ref, or receipt number.
3. taxableAmount: subtotal/taxable value before GST.
4. cgst / 5. sgst / 6. igst: numeric, 0 when absent.
7. totalBillAmount: final grand total payable.
8. vendorName: vendor/merchant/supplier name.
9. gstin: supplier GSTIN if present.

Rules for amounts: return plain numbers (e.g. 1500.50), no currency symbols. If tax is shown
as one combined figure, split it 50/50 into CGST and SGST for an intra-state invoice, or put
it in IGST for inter-state. Taxable + CGST + SGST + IGST should reconcile to the total; if the
taxable amount is not stated, compute it as total minus taxes.

When docType is "notice", also fill noticeType (e.g. "GST ASMT-10", "IT 143(1)"),
issuingAuthority, and dueDate (the reply/compliance deadline, DD/MM/YYYY) when stated.

Report confidence as "high", "medium" or "low". Use "low" when the scan is unclear or the
document type is genuinely ambiguous — a wrong classification files the document in the
wrong place, which is worse than flagging it. When you cannot tell which domain a document
belongs to, file it under "mis" rather than guessing between Income Tax and GST.`;

export async function POST(req: Request) {
  const denied = requireAutomationKey(req);
  if (denied) return denied;

  try {
    const { base64Data, mimeType, fileName } = await req.json();

    if (!base64Data || !mimeType) {
      return createErrorResponse("bad_request", "Missing base64Data or mimeType", 400);
    }

    const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const ai = getGeminiAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: PROMPT },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            folder: { type: Type.STRING, description: `Filing folder key, one of: ${FOLDER_KEYS.join(", ")}` },
            docType: { type: Type.STRING, description: "invoice, notice, or other" },
            label: { type: Type.STRING, description: "Filesystem-safe folder name" },
            confidence: { type: Type.STRING, description: "high, medium, or low" },
            date: { type: Type.STRING, description: "Invoice date e.g. 15/04/2026" },
            billNumber: { type: Type.STRING, description: "Invoice number e.g. INV-2026-001" },
            taxableAmount: { type: Type.NUMBER, description: "Taxable subtotal before GST" },
            cgst: { type: Type.NUMBER, description: "Central GST amount (0 if none)" },
            sgst: { type: Type.NUMBER, description: "State GST amount (0 if none)" },
            igst: { type: Type.NUMBER, description: "Integrated GST amount (0 if none)" },
            totalBillAmount: { type: Type.NUMBER, description: "Total including all taxes" },
            vendorName: { type: Type.STRING, description: "Supplier business name" },
            gstin: { type: Type.STRING, description: "Supplier GSTIN" },
            noticeType: { type: Type.STRING, description: "e.g. GST ASMT-10" },
            issuingAuthority: { type: Type.STRING, description: "Authority that issued the notice" },
            dueDate: { type: Type.STRING, description: "Reply deadline e.g. 20/08/2026" },
          },
          required: ["folder", "docType", "label", "confidence"],
        },
      },
    });

    const raw = JSON.parse(response.text || "{}");
    const docType: "invoice" | "notice" | "other" =
      raw.docType === "invoice" || raw.docType === "notice" ? raw.docType : "other";

    // Gemini is told to return a safe label, but it is still model output being used as a
    // folder name — strip anything that could escape the intended directory.
    const label =
      String(raw.label || "")
        .replace(/[^A-Za-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || `${docType.toUpperCase()}-untitled`;

    // folderByKey falls back to "4. MIS and Other Documents" for anything unrecognised, so a
    // surprise value files the document somewhere sane instead of failing the upload.
    const folder = folderByKey(String(raw.folder || ""));

    const data: Record<string, unknown> = {
      docType,
      label,
      confidence: raw.confidence || "medium",
      fileName,
      folder: {
        key: folder.key,
        name: folder.name,
        id: folder.id,
        path: folder.parent === "(root)" ? folder.name : `${folder.parent}/${folder.name}`,
      },
    };

    if (docType === "invoice") {
      data.invoice = {
        date: String(raw.date || "N/A"),
        billNumber: String(raw.billNumber || "N/A"),
        taxableAmount: Number(raw.taxableAmount) || 0,
        cgst: Number(raw.cgst) || 0,
        sgst: Number(raw.sgst) || 0,
        igst: Number(raw.igst) || 0,
        totalBillAmount: Number(raw.totalBillAmount) || 0,
        vendorName: raw.vendorName ? String(raw.vendorName) : undefined,
        gstin: raw.gstin ? String(raw.gstin) : undefined,
      };
    }

    if (docType === "notice") {
      data.notice = {
        noticeType: String(raw.noticeType || "Unclassified notice"),
        issuingAuthority: raw.issuingAuthority ? String(raw.issuingAuthority) : undefined,
        dueDate: raw.dueDate ? String(raw.dueDate) : undefined,
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error classifying document with Gemini:", error);
    return createErrorResponse("classify_failed", (error instanceof Error ? error.message : "") || "Failed to classify document", 500);
  }
}
