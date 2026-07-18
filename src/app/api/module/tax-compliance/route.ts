import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Tax Compliance & Litigation Boardroom.
// Access control is handled by the module's own role switcher and simulated permission gates.
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "tax-compliance.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal Tax Compliance module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read private Tax Compliance HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
