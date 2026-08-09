import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GST Reconciliation & Multi-Year Analytics Private Boardroom Module.
// Access control is handled inside the module and via dashboard permission gates.
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "gst-reco-analytics.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal GST Reconciliation Analytics module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read private GST Reconciliation Analytics HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
