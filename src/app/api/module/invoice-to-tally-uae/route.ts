import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// UAE Invoice → Tally Converter module (AED / FTA VAT).
// Access control is the Supabase login gate inside the served HTML, same as the
// other boardroom modules. All invoice processing is client-side; every invoice
// is read by the AI tier (no offline heuristics in the UAE variant).
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "invoice-to-tally-uae.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("UAE Invoice to Tally module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read UAE Invoice to Tally module HTML file:", e);
    return new NextResponse("Error reading module content.", { status: 500 });
  }
}
