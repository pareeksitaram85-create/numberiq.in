import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Face Attendance — biometric punch station, register and payroll export.
// Access control is handled by the module's own Supabase login gate (slug: attendance-face).
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "private-modules", "attendance-face.html");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Internal Face Attendance module file not found.", { status: 404 });
    }

    const htmlContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        // camera + location are used by the punch station itself
        "Permissions-Policy": "camera=(self), geolocation=(self), microphone=()",
      },
    });
  } catch (e) {
    console.error("Failed to read private Face Attendance HTML file:", e);
    return new NextResponse("Error reading internal module content.", { status: 500 });
  }
}
