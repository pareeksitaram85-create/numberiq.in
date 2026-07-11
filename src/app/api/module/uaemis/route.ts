import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// CA Boardroom / UAE MIS.
// Access control is handled by the module's own IGP login (Supabase)
// inside uaemis.html — no site-level (admin) login required.
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "uaemis.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal UAE MIS module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read private MIS HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
