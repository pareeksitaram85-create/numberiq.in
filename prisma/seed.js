/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/numberiq?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Loading seed data...");
  const seedDataPath = path.join(__dirname, 'seedData.json');
  
  if (!fs.existsSync(seedDataPath)) {
    console.error("Error: seedData.json not found!");
    return;
  }

  const { posts, terms } = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

  const forceSeed = process.env.FORCE_SEED === "true";

  // Row counts are a bad staleness signal on their own: editing the text of an
  // entry that already exists leaves the count unchanged, so a count-only guard
  // skips the seed and pins production to whatever was written first. That is how
  // expanded glossary entries silently failed to reach the live site. Compare the
  // fields instead and write only what actually drifted — two reads, and no writes
  // at all when the database already matches seedData.json.
  const dbTerms = await prisma.term.findMany();
  const dbPosts = await prisma.post.findMany();
  const dbTermBySlug = new Map(dbTerms.map((t) => [t.slug, t]));
  const dbPostBySlug = new Map(dbPosts.map((p) => [p.slug, p]));

  const termDrifted = (t) => {
    const db = dbTermBySlug.get(t.slug);
    if (!db) return true;
    return (
      db.term !== t.term ||
      db.category !== t.category ||
      db.definition !== t.definition ||
      db.explanation !== t.explanation ||
      (db.sections ?? null) !== (t.sections ?? null) ||
      JSON.stringify(db.takeaways ?? []) !== JSON.stringify(t.takeaways ?? [])
    );
  };

  const postDrifted = (p) => {
    const db = dbPostBySlug.get(p.slug);
    if (!db) return true;
    return (
      db.title !== p.title ||
      db.content !== p.content ||
      db.excerpt !== p.excerpt ||
      db.published !== p.published ||
      db.category !== p.category ||
      db.readingTime !== p.readingTime ||
      db.authorName !== (p.authorName || "CA SR Pareek") ||
      JSON.stringify(db.faq ?? null) !== JSON.stringify(p.faq ?? null)
    );
  };

  const staleTerms = forceSeed ? terms : terms.filter(termDrifted);
  const stalePosts = forceSeed ? posts : posts.filter(postDrifted);

  if (staleTerms.length === 0 && stalePosts.length === 0) {
    console.log(`Database already matches seedData.json (${dbTerms.length} terms, ${dbPosts.length} posts). Nothing to seed.`);
    return;
  }

  console.log(`Seeding ${staleTerms.length} of ${terms.length} glossary terms...`);

  for (const t of staleTerms) {
    await prisma.term.upsert({
      where: { slug: t.slug },
      update: {
        term: t.term,
        category: t.category,
        definition: t.definition,
        explanation: t.explanation,
        sections: t.sections,
        takeaways: t.takeaways
      },
      create: {
        slug: t.slug,
        term: t.term,
        category: t.category,
        definition: t.definition,
        explanation: t.explanation,
        sections: t.sections,
        takeaways: t.takeaways
      }
    });
  }

  console.log(`Seeding ${stalePosts.length} of ${posts.length} posts (insights)...`);

  for (const p of stalePosts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        published: p.published,
        category: p.category,
        readingTime: p.readingTime,
        faq: p.faq || undefined,
        authorName: p.authorName || "CA SR Pareek",
        createdAt: new Date(p.createdAt)
      },
      create: {
        slug: p.slug,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        published: p.published,
        category: p.category,
        readingTime: p.readingTime,
        faq: p.faq || undefined,
        authorName: p.authorName || "CA SR Pareek",
        createdAt: new Date(p.createdAt)
      }
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding (ignored for build):", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
