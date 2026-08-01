import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { guardPublicAiRoute } from "@/lib/api-guard";

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function POST(req: Request) {
  const denied = guardPublicAiRoute(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { base64Data, mimeType, fileName } = body;

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { success: false, error: "Missing base64Data or mimeType" },
        { status: 400 }
      );
    }

    const cleanBase64 = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    const ai = getGeminiAI();

    const promptText = `
Extract key details from this invoice/bill document.
We need the following fields accurately:
1. Date: Invoice or Bill Date (preferably DD/MM/YYYY or YYYY-MM-DD format).
2. Bill Number: Invoice Number, Bill No, Tax Invoice Ref, or Receipt Number.
3. Taxable Amount: Total subtotal/taxable value before GST/taxes.
4. CGST: Central GST amount (numeric, 0 if not present or 0).
5. SGST: State GST / UTGST amount (numeric, 0 if not present or 0).
6. IGST: Integrated GST amount (numeric, 0 if not present or 0).
7. Total Bill Amount: Final grand total payable.
8. Vendor Name: Name of vendor / merchant / supplier.
9. GSTIN: Supplier GSTIN if present.

Important:
- Return numeric amounts (e.g. 1500.50), without currency symbols.
- If tax is shown as a single tax amount or VAT and not broken into CGST/SGST/IGST:
  - If it's a standard intra-state GST invoice, divide tax into CGST and SGST (each 50% of tax).
  - If it's inter-state or IGST, populate IGST.
- Verify that Taxable Amount + CGST + SGST + IGST is as close as possible to Total Bill Amount. If missing explicit taxable amount, calculate it as Total Bill Amount - Taxes.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: {
              type: Type.STRING,
              description: "Date of bill/invoice e.g. 15/04/2026 or 2026-04-15",
            },
            billNumber: {
              type: Type.STRING,
              description: "Bill or Invoice Number e.g. INV-2026-001",
            },
            taxableAmount: {
              type: Type.NUMBER,
              description: "Taxable subtotal amount before GST",
            },
            cgst: {
              type: Type.NUMBER,
              description: "Central GST amount (0 if none)",
            },
            sgst: {
              type: Type.NUMBER,
              description: "State GST amount (0 if none)",
            },
            igst: {
              type: Type.NUMBER,
              description: "Integrated GST amount (0 if none)",
            },
            totalBillAmount: {
              type: Type.NUMBER,
              description: "Total invoice amount including all taxes",
            },
            vendorName: {
              type: Type.STRING,
              description: "Merchant/Supplier business name",
            },
            gstin: {
              type: Type.STRING,
              description: "Supplier GSTIN number",
            },
            confidence: {
              type: Type.STRING,
              description: "high, medium, or low",
            },
          },
          required: [
            "date",
            "billNumber",
            "taxableAmount",
            "cgst",
            "sgst",
            "igst",
            "totalBillAmount",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const extractedJSON = JSON.parse(responseText);

    const sanitizedData = {
      date: String(extractedJSON.date || "N/A"),
      billNumber: String(extractedJSON.billNumber || "N/A"),
      taxableAmount: Number(extractedJSON.taxableAmount) || 0,
      cgst: Number(extractedJSON.cgst) || 0,
      sgst: Number(extractedJSON.sgst) || 0,
      igst: Number(extractedJSON.igst) || 0,
      totalBillAmount: Number(extractedJSON.totalBillAmount) || 0,
      vendorName: extractedJSON.vendorName ? String(extractedJSON.vendorName) : undefined,
      gstin: extractedJSON.gstin ? String(extractedJSON.gstin) : undefined,
      confidence: extractedJSON.confidence || "high",
    };

    return NextResponse.json({
      success: true,
      data: sanitizedData,
      fileName,
    });
  } catch (error: any) {
    console.error("Error extracting invoice with Gemini:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to extract invoice data" },
      { status: 500 }
    );
  }
}
