import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to load fallback seed data if database is not active
function getFallbackData() {
  try {
    const seedPath = path.join(process.cwd(), "prisma", "seedData.json");
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, "utf8"));
    }
  } catch (e) {
    console.error("Failed to read seedData.json:", e);
  }
  return { posts: [], terms: [] };
}

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
  
  const fallback = getFallbackData();
  return fallback.posts.map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.createdAt)
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

  const fallback = getFallbackData();
  const post = fallback.posts.find((p: any) => p.slug === slug);
  if (post) {
    return {
      ...post,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.createdAt)
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

  const fallback = getFallbackData();
  return fallback.terms;
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

  const fallback = getFallbackData();
  return fallback.terms.find((t: any) => t.slug === slug) || null;
}
