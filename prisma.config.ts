import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback to a dummy connection string during build if DATABASE_URL is not set.
// This prevents Prisma config validation from crashing on Vercel.
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
