import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// International Business Boardroom.
// Access control is handled by the module's own Supabase login (like UAE MIS)
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "international-business.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal International Business module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read private International Business HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
