import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { type, records } = body;

    if (!type || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid payload parameters" }, { status: 400 });
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

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to batch import records" }, { status: 500 });
  }
}
