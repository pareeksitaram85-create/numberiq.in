import { createErrorResponse } from "./api-handler";

// /api/extract-invoice bills a Gemini call per request against the project's own key, with no
// user credential in front of it. It has to stay callable from the browser — the public
// invoice-to-tally tool depends on it — so it cannot simply require the automation key.
//
// Two cheap defences instead:
//   1. Same-origin only. A fetch() from our own page always sends Origin; curl and scripts
//      generally do not. This is not a security boundary (Origin is trivially forged) but it
//      stops casual scraping of a URL someone found in devtools.
//   2. A per-IP burst limit, so a forged Origin still cannot run up an unbounded bill.
//
// The automation key bypasses both, so n8n can call the same route server-to-server.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

// Per-instance only. Serverless spreads callers across workers, so the real ceiling is
// higher than MAX_PER_WINDOW. Good enough to blunt a runaway script; not a quota guarantee.
const hits = new Map<string, number[]>();

function allowedHost(host: string) {
  return (
    host === "numberiq.in" ||
    host === "www.numberiq.in" ||
    host.endsWith(".vercel.app") ||
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:")
  );
}

function sameOrigin(req: Request) {
  const raw = req.headers.get("origin") || req.headers.get("referer");
  if (!raw) return false;
  try {
    return allowedHost(new URL(raw).host);
  } catch {
    return false;
  }
}

function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function overLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every(t => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

/**
 * Guards a public AI route that spends the project's own API quota.
 * Returns an error response to send back, or null when the caller may proceed.
 */
export function guardPublicAiRoute(req: Request) {
  const automationKey = process.env.AUTOMATION_API_KEY;
  const provided = req.headers.get("x-numberiq-key");
  if (automationKey && provided === automationKey) return null;

  if (!sameOrigin(req)) {
    return createErrorResponse(
      "forbidden",
      "This endpoint is only callable from NumberIQ.",
      403
    );
  }

  if (overLimit(clientIp(req))) {
    return createErrorResponse(
      "rate_limited",
      "Too many extractions from this address. Please try again later.",
      429
    );
  }

  return null;
}
