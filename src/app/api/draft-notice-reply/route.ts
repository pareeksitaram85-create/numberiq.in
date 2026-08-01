import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { requireAutomationKey } from "@/lib/automation-auth";
import { createErrorResponse } from "@/lib/api-handler";

// Drafts a reply skeleton for a tax notice. This produces a starting point for a CA to
// edit — never a filing-ready document. The model is explicitly barred from asserting legal
// conclusions or citing case law, because a fabricated citation in a reply to the department
// is far more damaging than a blank space the CA has to fill in.

const REVIEW_NOTE =
  "> **Draft only.** Prepared by NumberIQ from an automated reading of the notice. " +
  "Verify every fact, figure and date against the original notice and your records, and " +
  "have a qualified professional review this before filing.";

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

const PROMPT = `You are assisting an Indian chartered accountant who has received the attached
notice from a tax authority. Produce a factual summary and a draft reply skeleton.

Fill these fields:
- noticeType: the form or section, e.g. "GST ASMT-10", "Income Tax 143(1)", "TDS Default".
- issuingAuthority: the office or officer that issued it, as printed on the notice.
- noticeDate: date of issue (DD/MM/YYYY) when stated.
- dueDate: the reply or compliance deadline (DD/MM/YYYY) when stated.
- referenceNumber: DIN / ARN / notice reference number when printed.
- summary: markdown. What the notice asks for, the periods and the amounts involved, and
  what happens if it is not answered by the deadline. Stick to what the document says.
- pointsRaised: markdown bullet list, one line per discrepancy or query the notice raises.
- documentsNeeded: markdown bullet list of records the CA will need to gather to answer it.
- draftReply: markdown. A formal reply letter skeleton addressed to the issuing authority,
  with the usual heads — reference, subject, para-wise response to each point raised, list of
  enclosures, and a signature block.

Hard rules for draftReply:
- It is a SKELETON. Where a fact, figure, date or explanation is needed, leave a clearly
  marked placeholder such as [INSERT RECONCILIATION FOR FY 2025-26] — never invent one.
- Do NOT state legal conclusions, do NOT assert that the assessee is right or the department
  is wrong, and do NOT predict an outcome.
- Do NOT cite any case law, judgment, circular or notification. If a point plainly turns on
  authority, write [CITE APPLICABLE AUTHORITY — VERIFY] instead.
- Do NOT invent figures, GSTINs, PANs, dates or document numbers that are not in the notice.
- Keep the tone factual and respectful; no argumentative or emotive language.

If the document is not actually a tax notice, set noticeType to "Not a notice" and leave
draftReply empty.`;

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
            noticeType: { type: Type.STRING, description: "Form or section of the notice" },
            issuingAuthority: { type: Type.STRING, description: "Issuing office or officer" },
            noticeDate: { type: Type.STRING, description: "Date of issue e.g. 20/07/2026" },
            dueDate: { type: Type.STRING, description: "Reply deadline e.g. 20/08/2026" },
            referenceNumber: { type: Type.STRING, description: "DIN / ARN / reference number" },
            summary: { type: Type.STRING, description: "Markdown summary of the notice" },
            pointsRaised: { type: Type.STRING, description: "Markdown bullet list of queries raised" },
            documentsNeeded: { type: Type.STRING, description: "Markdown bullet list of records needed" },
            draftReply: { type: Type.STRING, description: "Markdown reply letter skeleton" },
          },
          required: ["noticeType", "summary", "draftReply"],
        },
      },
    });

    const raw = JSON.parse(response.text || "{}");

    const noticeType = String(raw.noticeType || "Unclassified notice");
    const dueDate = raw.dueDate ? String(raw.dueDate) : undefined;

    const summaryMd = [
      `# ${noticeType}`,
      "",
      REVIEW_NOTE,
      "",
      raw.issuingAuthority ? `**Issued by:** ${raw.issuingAuthority}  ` : "",
      raw.noticeDate ? `**Notice date:** ${raw.noticeDate}  ` : "",
      dueDate ? `**Reply due:** ${dueDate}  ` : "",
      raw.referenceNumber ? `**Reference:** ${raw.referenceNumber}  ` : "",
      "",
      "## Summary",
      "",
      String(raw.summary || ""),
      raw.pointsRaised ? `\n## Points raised\n\n${raw.pointsRaised}` : "",
      raw.documentsNeeded ? `\n## Documents to gather\n\n${raw.documentsNeeded}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const draftReply = raw.draftReply
      ? `${REVIEW_NOTE}\n\n---\n\n${raw.draftReply}`
      : "";

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        noticeType,
        issuingAuthority: raw.issuingAuthority ? String(raw.issuingAuthority) : undefined,
        noticeDate: raw.noticeDate ? String(raw.noticeDate) : undefined,
        dueDate,
        referenceNumber: raw.referenceNumber ? String(raw.referenceNumber) : undefined,
        summary: summaryMd,
        draftReply,
      },
    });
  } catch (error) {
    console.error("Error drafting notice reply with Gemini:", error);
    return createErrorResponse("draft_failed", (error instanceof Error ? error.message : "") || "Failed to draft notice reply", 500);
  }
}
