import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// JC - GST Registration & ABOP Tracker Boardroom.
// Access control is handled inside the module or via dashboard permission gates.
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "jc-gst-abop-tracker.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal JC GST & ABOP Tracker module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    console.error("Failed to read private JC GST & ABOP Tracker HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
