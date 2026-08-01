import { timingSafeEqual } from "node:crypto";
import { createErrorResponse } from "./api-handler";

// The /api/classify-document, /api/invoice-to-tally, /api/draft-notice-reply and
// /api/automation/* routes are called by the n8n workflow, never by a browser. Without a
// shared secret they are open endpoints that spend the project's Gemini quota for anyone
// who finds the URL.

const HEADER = "x-numberiq-key";

function constantTimeEquals(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Returns an error response when the caller is not the automation, or null when it is. */
export function requireAutomationKey(req: Request) {
  const expected = process.env.AUTOMATION_API_KEY;
  if (!expected) {
    console.error("AUTOMATION_API_KEY is not set — refusing automation requests.");
    return createErrorResponse("not_configured", "Automation access is not configured.", 503);
  }

  const provided = req.headers.get(HEADER);
  if (!provided || !constantTimeEquals(provided, expected)) {
    return createErrorResponse("unauthorized", "Invalid or missing automation key.", 401);
  }

  return null;
}
