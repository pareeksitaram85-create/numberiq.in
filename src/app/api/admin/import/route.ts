import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { createErrorResponse, generateRequestId } from "@/lib/api-handler";

type ImportRecord = Record<string, unknown>;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v : fallback;

const slugify = (v: string): string =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(request: Request) {
  const requestId = generateRequestId();
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
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
    const { type, records } = body as { type?: string; records?: unknown };

    if (!type || !records || !Array.isArray(records)) {
      return createErrorResponse(
        "INVALID_PAYLOAD",
        "Invalid payload parameters. 'type' and 'records' are required.",
        400,
        undefined,
        requestId
      );
    }

    const rows = records as ImportRecord[];
    let importedCount = 0;

    if (type === "glossary") {
      // Every record needs a term (used for both display and slug fallback)
      const invalidIdx = rows.findIndex((rec) => !rec || !str(rec.term));
      if (invalidIdx !== -1) {
        return createErrorResponse(
          "INVALID_RECORD",
          `Record at index ${invalidIdx} is missing a valid 'term' field.`,
          400,
          undefined,
          requestId
        );
      }

      // Map records to Term model format
      const termsData = rows.map((rec) => ({
        slug: str(rec.slug) || slugify(str(rec.term)),
        term: str(rec.term),
        category: str(rec.category, "General"),
        definition: str(rec.definition),
        explanation: str(rec.explanation),
        sections: str(rec.sections),
        takeaways: Array.isArray(rec.takeaways)
          ? rec.takeaways.map((t) => str(t))
          : [str(rec.takeaways)],
      }));

      // Perform transaction to skip existing duplicates or insert them
      const result = await db.term.createMany({
        data: termsData,
        skipDuplicates: true
      });
      importedCount = result.count;
    } else if (type === "insights") {
      // Every record needs a title (used for both display and slug fallback)
      const invalidIdx = rows.findIndex((rec) => !rec || !str(rec.title));
      if (invalidIdx !== -1) {
        return createErrorResponse(
          "INVALID_RECORD",
          `Record at index ${invalidIdx} is missing a valid 'title' field.`,
          400,
          undefined,
          requestId
        );
      }

      // Map records to Post model format
      const postsData = rows.map((rec) => ({
        slug: str(rec.slug) || slugify(str(rec.title)),
        title: str(rec.title),
        content: str(rec.content),
        excerpt: str(rec.excerpt),
        published: rec.published === true || rec.published === "true",
        category: str(rec.category, "Tax"),
        readingTime: str(rec.readingTime, "3 min read"),
        authorName: str(rec.authorName, "NumberIQ Editorial"),
        faq: (rec.faq ?? {}) as Prisma.InputJsonValue,
      }));

      const result = await db.post.createMany({
        data: postsData,
        skipDuplicates: true
      });
      importedCount = result.count;
    } else {
      return createErrorResponse(
        "INVALID_TYPE",
        `Unsupported import type: '${type}'. Must be 'glossary' or 'insights'.`,
        400,
        undefined,
        requestId
      );
    }

    return NextResponse.json(
      { success: true, count: importedCount },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    console.error(`[API: admin/import] [Request ID: ${requestId}] Error during batch import:`, error);
    return createErrorResponse(
      "IMPORT_FAILED",
      error instanceof Error ? error.message : "Failed to batch import records.",
      500,
      undefined,
      requestId
    );
  }
}
