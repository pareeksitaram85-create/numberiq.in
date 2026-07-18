import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createErrorResponse,
  checkRateLimit,
  getClientIp,
  generateRequestId,
} from "@/lib/api-handler";

// Leads are stored in Postgres. The previous implementation wrote to a local
// JSON file, which is read-only on Vercel's serverless filesystem — every
// production submission failed. The table is created lazily because this
// project has no migration pipeline (schema changes reach production via
// manual `prisma db push`, which may not have run yet for Lead).
let leadTableReady = false;

async function ensureLeadTable() {
  if (leadTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Lead" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "query" TEXT NOT NULL DEFAULT '',
      "tool" TEXT NOT NULL DEFAULT 'general',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt")`
  );
  leadTableReady = true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,17}$/;

interface LeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  query: string;
  tool: string;
}

function validateLead(body: Record<string, unknown>): { data?: LeadInput; error?: string } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(body.name);
  const phone = str(body.phone);
  const email = str(body.email);
  const city = str(body.city);
  const query = str(body.query);
  const tool = str(body.tool) || "general";

  if (!name || !phone || !email || !city) {
    return { error: "Missing required fields (name, phone, email, and city are mandatory)." };
  }
  if (name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (city.length > 100) return { error: "City must be 100 characters or fewer." };
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: "Please provide a valid email address." };
  if (!PHONE_RE.test(phone)) return { error: "Please provide a valid phone number." };
  if (query.length > 2000) return { error: "Query must be 2000 characters or fewer." };
  if (tool.length > 100) return { error: "Invalid tool identifier." };

  return { data: { name, phone, email, city, query, tool } };
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const ip = getClientIp(request);

  // Rate Limit check: max 5 requests per minute for lead submissions
  const rateLimit = checkRateLimit(ip, 5, 60000);
  const headers = {
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.reset),
    "X-Request-Id": requestId,
  };

  if (!rateLimit.allowed) {
    console.warn(`[API: leads] [Request ID: ${requestId}] Rate limit exceeded for IP: ${ip}`);
    return createErrorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Too many submissions. Please try again in ${rateLimit.retryAfter} seconds.`,
      429,
      rateLimit.retryAfter,
      requestId
    );
  }

  try {
    const body = await request.json();
    const { data, error } = validateLead(body);
    if (error || !data) {
      return createErrorResponse("INVALID_FIELDS", error ?? "Invalid submission.", 400, undefined, requestId);
    }

    await ensureLeadTable();
    const lead = await prisma.lead.create({ data });

    return NextResponse.json({ success: true, leadId: lead.id }, { headers });
  } catch (error) {
    console.error(`[API: leads] [Request ID: ${requestId}] Error saving lead:`, error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to save lead submission. Please try again later.",
      500,
      undefined,
      requestId
    );
  }
}

export async function GET() {
  const requestId = generateRequestId();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      console.warn(`[API: leads] [Request ID: ${requestId}] Unauthorized leads retrieval attempt`);
      return createErrorResponse(
        "UNAUTHORIZED",
        "Unauthorized access. Admin privileges required.",
        401,
        undefined,
        requestId
      );
    }

    await ensureLeadTable();
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(leads, {
      headers: { "X-Request-Id": requestId },
    });
  } catch (error) {
    console.error(`[API: leads] [Request ID: ${requestId}] Error reading leads:`, error);
    return createErrorResponse("INTERNAL_ERROR", "Failed to read leads.", 500, undefined, requestId);
  }
}
