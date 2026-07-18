import { prisma } from "@/lib/prisma";
import fallbackData from "../../prisma/seedData.json";

interface FallbackPost {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  readingTime: string;
  published?: boolean;
  authorName?: string;
  faq?: unknown;
  createdAt?: string;
}

interface FallbackTerm {
  slug: string;
  term: string;
  category: string;
  definition: string;
  explanation: string;
  sections?: string | null;
  takeaways: string[];
}

function injectCallout(content: string): string {
  if (!content || content.includes("Income-tax Act 2025 update")) return content;

  const mappings = [
    { oldSec: "194C", newSec: "393(1)" },
    { oldSec: "194J", newSec: "393(1)" },
    { oldSec: "194H", newSec: "393(1)" },
    { oldSec: "192", newSec: "392" },
    { oldSec: "194A", newSec: "393(1)" },
    { oldSec: "194I", newSec: "393(1)" },
    { oldSec: "194O", newSec: "393(1)" },
    { oldSec: "195", newSec: "393(2)" },
    { oldSec: "201(1A)", newSec: "399(3)" },
    { oldSec: "234A", newSec: "432" },
    { oldSec: "234B", newSec: "433" },
    { oldSec: "234C", newSec: "434" },
    { oldSec: "43B(h)", newSec: "37" },
    { oldSec: "43B", newSec: "37" },
    { oldSec: "44ADA", newSec: "59" },
    { oldSec: "44AD", newSec: "58" },
    { oldSec: "115BAC", newSec: "202" },
    { oldSec: "80C", newSec: "123" },
    { oldSec: "80D", newSec: "124" },
    { oldSec: "139", newSec: "263" },
    { oldSec: "112A", newSec: "renumbered under the Income-tax Act 2025" },
    { oldSec: "112", newSec: "renumbered under the Income-tax Act 2025" },
    { oldSec: "206C(1G)", newSec: "renumbered under the Income-tax Act 2025" },
    { oldSec: "56(2)", newSec: "renumbered under the Income-tax Act 2025" }
  ];

  const detectedOld: string[] = [];
  const detectedNew: string[] = [];

  for (const m of mappings) {
    const escapedSec = m.oldSec.replace(/[()]/g, '\\$&');
    const regex = new RegExp(`\\b(Section\\s+)?${escapedSec}\\b`, 'i');
    if (regex.test(content)) {
      detectedOld.push(`Section ${m.oldSec}`);
      detectedNew.push(m.newSec.startsWith("renumbered") ? m.newSec : `Section ${m.newSec}`);
    }
  }

  if (detectedOld.length > 0) {
    // Deduplicate array values
    const uniqueOld = Array.from(new Set(detectedOld));
    const uniqueNew = Array.from(new Set(detectedNew));

    const oldLabel = uniqueOld.join(", ");
    const newLabel = uniqueNew.join(", ");

    const calloutHtml = `
      <div class="my-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200 text-xs md:text-sm leading-relaxed relative overflow-hidden" style="margin-top: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(245,158,11,0.2); background-color: rgba(245,158,11,0.05); color: #fef3c7; line-height: 1.6; position: relative;">
        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background-color: #f59e0b;"></div>
        <div style="display: flex; align-items: start; gap: 0.625rem; padding-left: 0.5rem;">
          <span style="font-size: 1.125rem; line-height: 1;">⚖️</span>
          <div>
            <strong>Income-tax Act 2025 update:</strong> ${oldLabel} of the 1961 Act ${uniqueOld.length > 1 ? 'are now renumbered as' : 'is now'} ${newLabel} under the new Income-tax Act 2025, effective 1 April 2026. Rates and thresholds discussed below remain applicable unless stated.
          </div>
        </div>
      </div>
    `;

    const pCloseIdx = content.indexOf("</p>");
    if (pCloseIdx !== -1) {
      return content.slice(0, pCloseIdx + 4) + calloutHtml + content.slice(pCloseIdx + 4);
    }
    return calloutHtml + content;
  }

  return content;
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (posts.length > 0) return posts;
  } catch {
    console.warn("Database offline. Falling back to local seedData.json for posts list.");
  }

  return (fallbackData.posts as FallbackPost[]).map((p) => ({
    id: p.slug,
    ...p,
    published: p.published !== undefined ? p.published : true,
    authorName: p.authorName || "CA Sitaram Pareek",
    faq: p.faq || null,
    updatedAt: new Date(p.createdAt || "2026-06-01"),
    createdAt: new Date(p.createdAt || "2026-06-01")
  }));
}

export async function getPostBySlug(slug: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
    });
    if (post) {
      return {
        ...post,
        content: injectCallout(post.content),
      };
    }
  } catch {
    console.warn(`Database offline. Falling back to local seedData.json for post: ${slug}`);
  }

  const post = (fallbackData.posts as FallbackPost[]).find((p) => p.slug === slug);
  if (post) {
    return {
      id: post.slug,
      ...post,
      content: injectCallout(post.content),
      published: post.published !== undefined ? post.published : true,
      authorName: post.authorName || "CA Sitaram Pareek",
      faq: post.faq || null,
      updatedAt: new Date(post.createdAt || "2026-06-01"),
      createdAt: new Date(post.createdAt || "2026-06-01")
    };
  }
  return null;
}

export async function getTerms() {
  try {
    const terms = await prisma.term.findMany({
      orderBy: { term: "asc" },
    });
    if (terms.length > 0) return terms;
  } catch {
    console.warn("Database offline. Falling back to local seedData.json for terms list.");
  }

  return fallbackData.terms;
}

export async function getTermBySlug(slug: string) {
  try {
    const term = await prisma.term.findUnique({
      where: { slug },
    });
    if (term) {
      return {
        ...term,
        explanation: injectCallout(term.explanation),
      };
    }
  } catch {
    console.warn(`Database offline. Falling back to local seedData.json for term: ${slug}`);
  }

  const term = (fallbackData.terms as FallbackTerm[]).find((t) => t.slug === slug) || null;
  if (term) {
    return {
      ...term,
      explanation: injectCallout(term.explanation),
    };
  }
  return null;
}
