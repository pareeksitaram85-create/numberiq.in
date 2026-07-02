const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize client with adapter in dev if using adapter,
// or just standard client since CLI can connect directly without adapters
const prisma = new PrismaClient();

async function main() {
  console.log("Loading seed data...");
  const seedDataPath = path.join(__dirname, 'seedData.json');
  
  if (!fs.existsSync(seedDataPath)) {
    console.error("Error: seedData.json not found!");
    return;
  }

  const { posts, terms } = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
  console.log(`Seeding ${terms.length} glossary terms...`);

  for (const t of terms) {
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

  console.log(`Seeding ${posts.length} posts (insights)...`);

  for (const p of posts) {
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
        createdAt: new Date(p.createdAt)
      }
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
