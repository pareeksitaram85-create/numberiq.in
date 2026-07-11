import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Invoice → Tally Converter module.
// Everything runs client-side in the served HTML (PDF reading, ledger matching,
// Tally XML generation) — this route only serves the self-contained page.
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "invoice-to-tally.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Invoice to Tally module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read Invoice to Tally module HTML file:", e);
    return new NextResponse("Error reading module content.", { status: 500 });
  }
}
