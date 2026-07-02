# NumberIQ — Unified Finance & Taxation Workspace

NumberIQ is a premium, enterprise-grade tax and financial analysis application redesigned using **Next.js (App Router)**, **Prisma**, **TypeScript**, and **TailwindCSS**. 

It is engineered to compile and run under severe resource constraints, providing a world-class SaaS user experience with zero monthly hosting overhead.

---

## 🏛️ Architecture Overview

The system transitions from legacy file layouts to a unified, scalable App Router layout:

```
deploy/
├── .github/workflows/nextjs.yml  # GitHub Actions CI/CD Build pipeline
├── prisma/
│   ├── schema.prisma             # Unified relational database schema
│   ├── seedData.json             # Compaction payload (100 articles + 50 terms)
│   └── seed.ts                   # Prisma database seeder script
├── src/
│   ├── app/
│   │   ├── admin/                # Central Management Workspace Console
│   │   ├── api/auth/             # NextAuth authentication endpoint
│   │   ├── auth/signin/          # Custom sign-in UI (Google & Credentials)
│   │   ├── dashboard/            # Practitioner Workspace dashboard
│   │   ├── glossary/             # Terms and legal reference definitions
│   │   ├── insights/             # CA-reviewed articles & tax updates
│   │   ├── tools/                # 16 Interactive financial calculators
│   │   ├── layout.tsx            # Global layout with providers
│   │   ├── sitemap.ts            # Dynamic search engine index generator
│   │   └── robots.ts             # Dynamic crawler instructions
│   ├── components/               # Shareable React components & UI blocks
│   └── lib/                      # Core helpers (content loading, DB instance)
```

---

## 💾 Resilient Dual-Mode Data Loader

NumberIQ utilizes a **hybrid content loader** (`src/lib/content.ts`) that guarantees 100% uptime:
1. **Primary**: Queries live PostgreSQL databases via Prisma client.
2. **Secondary Fallback**: If the database is offline or unconfigured, it automatically fallbacks to reading compiled articles and terms from `prisma/seedData.json`.

This allows the application to compile, build, and run immediately on Vercel Hobby tier without requiring active database connections.

---

## 🛠️ Developer Setup & Commands

### 1. Installation
Install all production dependencies and TypeScript declarations:
```bash
npm install
```

### 2. Database Migrations
Configure your PostgreSQL connection string in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/numberiq?schema=public"
NEXTAUTH_SECRET="your-32-character-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Push schemas and seed contents into the active database:
```bash
# Push schemas to PostgreSQL
npx prisma db push

# Seed 100 blog posts and 50 glossary terms
npx prisma db seed
```

### 3. Local Development
Start the Next.js dev server:
```bash
npm run dev
```

### 4. Build Production Bundle
Run lint checks, TypeScript audits, and build static page assets:
```bash
npm run build
```

---

## 🔐 Credentials & Demo Testing

For sandbox environments, utilize the built-in NextAuth test credentials:
- **Username**: `admin@numberiq.in`
- **Password**: `admin123`
- **Role**: `ADMIN` (unclocks access to `/admin` dashboard)

---

## 🚀 SEO & Security Headers

- **CSP Headers**: Strict Content-Security-Policy (CSP) headers are configured inside `next.config.ts` alongside frame protections.
- **Sitemap**: Dynamic `sitemap.xml` mapping of all static pages, calculators, insights articles, and glossary definitions.
- **Robots**: Customized `robots.txt` prohibiting bot indexing of `/admin/` and `/dashboard/` workspaces.
