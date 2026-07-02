import { prisma } from "@/lib/prisma";
import fallbackData from "../../prisma/seedData.json";

export async function getPosts() {
  try {
    // Attempt database query
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (posts.length > 0) return posts;
  } catch (e) {
    console.warn("Database offline. Falling back to local seedData.json for posts list.");
  }
  
  return (fallbackData.posts as any[]).map((p: any) => ({
    id: p.slug,
    ...p,
    published: p.published !== undefined ? p.published : true,
    authorName: p.authorName || "NumberIQ Editorial",
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
    if (post) return post;
  } catch (e) {
    console.warn(`Database offline. Falling back to local seedData.json for post: ${slug}`);
  }

  const post: any = (fallbackData.posts as any[]).find((p: any) => p.slug === slug);
  if (post) {
    return {
      id: post.slug,
      ...post,
      published: post.published !== undefined ? post.published : true,
      authorName: post.authorName || "NumberIQ Editorial",
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
  } catch (e) {
    console.warn("Database offline. Falling back to local seedData.json for terms list.");
  }

  return fallbackData.terms;
}

export async function getTermBySlug(slug: string) {
  try {
    const term = await prisma.term.findUnique({
      where: { slug },
    });
    if (term) return term;
  } catch (e) {
    console.warn(`Database offline. Falling back to local seedData.json for term: ${slug}`);
  }

  return fallbackData.terms.find((t: any) => t.slug === slug) || null;
}
