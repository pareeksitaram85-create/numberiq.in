import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized. Please log in to access this internal module.", {
      status: 401,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

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
