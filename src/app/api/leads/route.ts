import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  createErrorResponse, 
  checkRateLimit, 
  getClientIp, 
  generateRequestId 
} from "@/lib/api-handler";

const leadsFilePath = path.join(process.cwd(), "src/data/leads.json");

// Ensure directory and file exist
function ensureLeadsFile() {
  const dir = path.dirname(leadsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(leadsFilePath)) {
    fs.writeFileSync(leadsFilePath, JSON.stringify([], null, 2));
  }
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
    const { name, phone, email, city, query, tool } = body;

    if (!name || !phone || !email || !city) {
      return createErrorResponse(
        "INVALID_FIELDS",
        "Missing required fields (name, phone, email, and city are mandatory).",
        400,
        undefined,
        requestId
      );
    }

    ensureLeadsFile();

    const data = fs.readFileSync(leadsFilePath, "utf8");
    const leads = JSON.parse(data);

    const newLead = {
      id: `lead_${Date.now()}`,
      name,
      phone,
      email,
      city,
      query: query || "",
      tool: tool || "general",
      createdAt: new Date().toISOString()
    };

    leads.push(newLead);
    fs.writeFileSync(leadsFilePath, JSON.stringify(leads, null, 2));

    return NextResponse.json(
      { success: true, leadId: newLead.id },
      { headers }
    );
  } catch (error: any) {
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

export async function GET(request: Request) {
  const requestId = generateRequestId();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      console.warn(`[API: leads] [Request ID: ${requestId}] Unauthorized leads retrieval attempt`);
      return createErrorResponse(
        "UNAUTHORIZED",
        "Unauthorized access. Admin privileges required.",
        401,
        undefined,
        requestId
      );
    }

    ensureLeadsFile();
    const data = fs.readFileSync(leadsFilePath, "utf8");
    const leads = JSON.parse(data);
    return NextResponse.json(leads, {
      headers: {
        "X-Request-Id": requestId
      }
    });
  } catch (error: any) {
    console.error(`[API: leads] [Request ID: ${requestId}] Error reading leads:`, error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to read leads.",
      500,
      undefined,
      requestId
    );
  }
}
