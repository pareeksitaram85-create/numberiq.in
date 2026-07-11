import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { createErrorResponse, generateRequestId } from "@/lib/api-handler";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      console.warn(`[API: admin/import] [Request ID: ${requestId}] Unauthorized access attempt`);
      return createErrorResponse(
        "UNAUTHORIZED",
        "Unauthorized access. Admin privileges required.",
        401,
        undefined,
        requestId
      );
    }

    const body = await request.json();
    const { type, records } = body;

    if (!type || !records || !Array.isArray(records)) {
      return createErrorResponse(
        "INVALID_PAYLOAD",
        "Invalid payload parameters. 'type' and 'records' are required.",
        400,
        undefined,
        requestId
      );
    }

    let importedCount = 0;

    if (type === "glossary") {
      // Map records to Term model format
      const termsData = records.map((rec: any) => ({
        slug: rec.slug || rec.term.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        term: rec.term,
        category: rec.category || "General",
        definition: rec.definition || "",
        explanation: rec.explanation || "",
        sections: rec.sections || "",
        takeaways: Array.isArray(rec.takeaways) ? rec.takeaways : [rec.takeaways || ""]
      }));

      // Perform transaction to skip existing duplicates or insert them
      const result = await db.term.createMany({
        data: termsData,
        skipDuplicates: true
      });
      importedCount = result.count;
    } else if (type === "insights") {
      // Map records to Post model format
      const postsData = records.map((rec: any) => ({
        slug: rec.slug || rec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: rec.title,
        content: rec.content || "",
        excerpt: rec.excerpt || "",
        published: rec.published === true || rec.published === "true",
        category: rec.category || "Tax",
        readingTime: rec.readingTime || "3 min read",
        authorName: rec.authorName || "NumberIQ Editorial",
        faq: rec.faq ? JSON.parse(JSON.stringify(rec.faq)) : {}
      }));

      const result = await db.post.createMany({
        data: postsData,
        skipDuplicates: true
      });
      importedCount = result.count;
    }

    return NextResponse.json(
      { success: true, count: importedCount },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (error: any) {
    console.error(`[API: admin/import] [Request ID: ${requestId}] Error during batch import:`, error);
    return createErrorResponse(
      "IMPORT_FAILED",
      error.message || "Failed to batch import records.",
      500,
      undefined,
      requestId
    );
  }
}
