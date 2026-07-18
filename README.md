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
│   └── lib/                      # Core helpers (content loading, DB instance, math)
```

---

## 💾 Resilient Dual-Mode Data Loader

NumberIQ utilizes a **hybrid content loader** (`src/lib/content.ts`) that guarantees 100% uptime:
1. **Primary**: Queries live PostgreSQL databases via Prisma client.
2. **Secondary Fallback**: If the database is offline or unconfigured, it automatically falls back to reading compiled articles and terms from `prisma/seedData.json`.

This allows the application to compile, build, and run immediately on Vercel Hobby tier without requiring active database connections.

---

## ⚡ Build & Seeding Optimizations

During `next build`, Prisma seeding runs automatically to ensure database records exist. To prevent slow build compilation and redundant operations:
1. **Smart Seeding Check**: The seeder (`prisma/seed.js`) checks database `Term` and `Post` counts first. If they match the seed payload count, upserts are skipped, saving 150+ network roundtrips.
2. **Override**: To force-overwrite the database, set the environment variable:
   ```env
   FORCE_SEED="true"
   ```

---

## 🛡️ Security Headers & CSP

* **Dynamic CSP**: Strict Content-Security-Policy (CSP) headers are configured inside `next.config.ts`. In production mode, `'unsafe-eval'` is stripped automatically from `script-src` to prevent cross-site scripting vulnerabilities, while preserved in local development for Fast Refresh compatibility.
* **Security Standards**: Employs `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security`.

---

## 🧪 Unit Testing Framework

NumberIQ implements **Vitest** for isolated unit testing of financial calculations:
* Core calculation modules (GST Section 50 Interest, Section 47 Late Fee, Section 206C(1G) LRS TCS, Property gains with Section 50C SDV indexation rules, Equity grandfathering, and Mutual Funds) reside in `src/lib/calculator-math.ts`.
* Tests are executed in seconds with zero database or interface overhead.

Run tests locally:
```bash
npm run test
```

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

## 🚀 Production Deployment Checklist (Vercel)

Before deploying to Vercel production, configure the following environment variables in Vercel settings to enable admin access and form submissions:

1. **`DATABASE_URL`**: Your PostgreSQL connection string.
2. **`ADMIN_EMAIL`**: Secure admin login username (e.g., `admin@numberiq.in`).
3. **`ADMIN_PASSWORD`**: Secure admin login password (timing-safe verification).
4. **`NEXTAUTH_SECRET`**: Random 32-character string (generate with `openssl rand -base64 32`).
5. **`NEXTAUTH_URL`**: `https://numberiq.in`
