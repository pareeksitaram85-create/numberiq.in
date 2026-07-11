import { NextResponse } from "next/server";
import { 
  createErrorResponse, 
  checkRateLimit, 
  getClientIp, 
  generateRequestId 
} from "@/lib/api-handler";
import { getCircuitBreaker } from "@/lib/circuit-breaker";

const MOCK_RECORDS: Record<string, any> = {
  "MSTEC9182F": {
    pan: "MSTEC9182F",
    udyamNumber: "UDYAM-MH-19-0128456",
    name: "Mastech Systems Private Limited",
    type: "Micro",
    activity: "Services",
    status: "Active"
  },
  "KDKSO8162G": {
    pan: "KDKSO8162G",
    udyamNumber: "UDYAM-RJ-17-0038291",
    name: "KDK Software Solutions",
    type: "Small",
    activity: "Services",
    status: "Active"
  },
  "TCSIND1029D": {
    pan: "TCSIND1029D",
    udyamNumber: "UDYAM-DL-10-0982314",
    name: "Tata Consultancy Services Ltd",
    type: "Medium",
    activity: "Services",
    status: "Active"
  },
  "RELIAN8271A": {
    pan: "RELIAN8271A",
    udyamNumber: "Not Found (Non-MSME)",
    name: "Reliance Industries Limited",
    type: "Non-MSME",
    activity: "Manufacturing",
    status: "Inactive"
  }
};

// Initialize Circuit Breakers for external APIs
const surepassBreaker = getCircuitBreaker("surepass", {
  failureThreshold: 3,
  cooldownPeriodMs: 30000,
});

const cashfreeBreaker = getCircuitBreaker("cashfree", {
  failureThreshold: 3,
  cooldownPeriodMs: 30000,
});

// Fetch helper with Request Timeout and Exponential Backoff Retries
async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit,
  retries: number = 2,
  delayMs: number = 1000
): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      // AbortSignal.timeout enforces maximum 30 seconds request timeout
      const signal = AbortSignal.timeout(30000);
      const response = await fetch(url, { ...options, signal });
      
      // If 5xx server error, trigger retry
      if (response.status >= 500 && attempt < retries) {
        attempt++;
        console.warn(`[Fetch Retry] 5xx status ${response.status} from ${url}. Retrying in ${delayMs}ms (attempt ${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
        continue;
      }
      return response;
    } catch (err: any) {
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError" || err.message?.includes("timeout");
      if ((isTimeout || err.message?.includes("fetch")) && attempt < retries) {
        attempt++;
        console.warn(`[Fetch Retry] Timeout/network error (${err.message}) on ${url}. Retrying in ${delayMs}ms (attempt ${attempt}/${retries})`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed to contact external API after ${retries} retries.`);
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const ip = getClientIp(request);
  
  // Rate Limit: 10 queries per minute per client
  const rateLimit = checkRateLimit(ip, 10, 60000);
  const headers = {
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.reset),
    "X-Request-Id": requestId,
  };

  if (!rateLimit.allowed) {
    console.warn(`[API: msme-lookup] [Request ID: ${requestId}] Rate limit exceeded for IP: ${ip}`);
    return createErrorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
      429,
      rateLimit.retryAfter,
      requestId
    );
  }

  try {
    const { pan, mode, provider, apiKey, apiSecret } = await request.json();

    if (!pan || typeof pan !== "string" || pan.length !== 10) {
      return createErrorResponse(
        "INVALID_PAN",
        "Invalid PAN format. Must be a 10-character alphanumeric string.",
        400,
        undefined,
        requestId
      );
    }

    const cleanPan = pan.trim().toUpperCase();

    // 1. DEMO MODE
    if (mode === "demo") {
      if (MOCK_RECORDS[cleanPan]) {
        return NextResponse.json(
          { success: true, data: MOCK_RECORDS[cleanPan], source: "demo" },
          { headers }
        );
      }

      // Generate realistic mock data
      const fifth = cleanPan.charAt(4);
      let entityName = "ABC Enterprise (Demo)";
      if (fifth === "C") entityName = "Global Tech Industries Ltd (Demo)";
      else if (fifth === "P") entityName = "Rajesh Kumar & Sons (Demo)";
      else if (fifth === "F") entityName = "Apex Logistics Firm (Demo)";

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const isRegistered = Math.random() > 0.3; // 70% chance of being registered in demo

      const result = isRegistered ? {
        pan: cleanPan,
        udyamNumber: `UDYAM-MH-19-0${randomSuffix}`,
        name: entityName,
        type: Math.random() > 0.4 ? "Micro" : "Small",
        activity: Math.random() > 0.5 ? "Manufacturing" : "Services",
        status: "Active"
      } : {
        pan: cleanPan,
        udyamNumber: "Not Found (Non-MSME)",
        name: entityName,
        type: "Non-MSME",
        activity: "N/A",
        status: "Inactive"
      };

      return NextResponse.json(
        { success: true, data: result, source: "demo" },
        { headers }
      );
    }

    // 2. LIVE MODE
    if (mode === "live") {
      if (!apiKey) {
        return createErrorResponse(
          "API_KEY_REQUIRED",
          "API Key is required for Live Mode.",
          400,
          undefined,
          requestId
        );
      }

      // Surepass Integration
      if (provider === "surepass") {
        try {
          const response = await surepassBreaker.execute(async () => {
            return await fetchWithRetryAndTimeout("https://api.surepass.io/api/v1/corporate/msme-search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({ id_number: cleanPan })
            });
          });

          if (!response.ok) {
            const errBody = await response.text();
            console.error(`[API: msme-lookup] [Request ID: ${requestId}] Surepass HTTP error ${response.status}:`, errBody);
            
            // If it's a transient 5xx, or authentication 401/403
            if (response.status === 401 || response.status === 403) {
              return createErrorResponse(
                "PROVIDER_AUTH_ERROR",
                "Authentication failed with verification provider. Please check API Key.",
                401,
                undefined,
                requestId
              );
            }
            return createErrorResponse(
              "PROVIDER_ERROR",
              `Provider returned error: ${errBody.slice(0, 100)}`,
              response.status,
              undefined,
              requestId
            );
          }

          const resData = await response.json();
          if (resData.success && resData.data) {
            return NextResponse.json({
              success: true,
              data: {
                pan: cleanPan,
                udyamNumber: resData.data.udyam_registration_number || "Not Found",
                name: resData.data.enterprise_name || "N/A",
                type: resData.data.enterprise_type || "Non-MSME",
                activity: resData.data.activity_type || "N/A",
                status: resData.data.status || "Inactive"
              },
              source: "surepass"
            }, { headers });
          } else {
            return createErrorResponse(
              "NO_RECORD_FOUND",
              resData.message || "Failed to find Udyam details for the specified PAN.",
              404,
              undefined,
              requestId
            );
          }
        } catch (err: any) {
          console.error(`[API: msme-lookup] [Request ID: ${requestId}] Surepass connection/breaker error:`, err.message);
          const isBreakerOpen = err.message?.includes("blocked") || err.message?.includes("OPEN");
          return createErrorResponse(
            isBreakerOpen ? "SERVICE_UNAVAILABLE" : "PROVIDER_TIMEOUT",
            isBreakerOpen 
              ? "Verification service is temporarily unavailable due to high error rates. Please try again in 30 seconds." 
              : "Connection to Surepass API timed out. Please retry.",
            isBreakerOpen ? 503 : 504,
            isBreakerOpen ? 30 : undefined,
            requestId
          );
        }
      }

      // Cashfree Integration
      if (provider === "cashfree") {
        if (!apiSecret) {
          return createErrorResponse(
            "API_SECRET_REQUIRED",
            "API Secret is required for Cashfree Mode.",
            400,
            undefined,
            requestId
          );
        }

        try {
          const response = await cashfreeBreaker.execute(async () => {
            return await fetchWithRetryAndTimeout("https://verification.cashfree.com/v1/verification/udyam", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-client-id": apiKey,
                "x-client-secret": apiSecret
              },
              body: JSON.stringify({ pan: cleanPan })
            });
          });

          if (!response.ok) {
            const errBody = await response.text();
            console.error(`[API: msme-lookup] [Request ID: ${requestId}] Cashfree HTTP error ${response.status}:`, errBody);
            
            if (response.status === 401 || response.status === 403) {
              return createErrorResponse(
                "PROVIDER_AUTH_ERROR",
                "Authentication failed with Cashfree. Check credentials.",
                401,
                undefined,
                requestId
              );
            }
            return createErrorResponse(
              "PROVIDER_ERROR",
              `Provider returned error: ${errBody.slice(0, 100)}`,
              response.status,
              undefined,
              requestId
            );
          }

          const resData = await response.json();
          if (resData.status === "SUCCESS" && resData.udyam_details) {
            return NextResponse.json({
              success: true,
              data: {
                pan: cleanPan,
                udyamNumber: resData.udyam_details.udyam_registration_number || "Not Found",
                name: resData.udyam_details.enterprise_name || "N/A",
                type: resData.udyam_details.enterprise_type || "Non-MSME",
                activity: resData.udyam_details.activity_type || "N/A",
                status: resData.udyam_details.status || "Active"
              },
              source: "cashfree"
            }, { headers });
          } else {
            return createErrorResponse(
              "NO_RECORD_FOUND",
              resData.message || "Failed to retrieve Udyam details from Cashfree.",
              404,
              undefined,
              requestId
            );
          }
        } catch (err: any) {
          console.error(`[API: msme-lookup] [Request ID: ${requestId}] Cashfree connection/breaker error:`, err.message);
          const isBreakerOpen = err.message?.includes("blocked") || err.message?.includes("OPEN");
          return createErrorResponse(
            isBreakerOpen ? "SERVICE_UNAVAILABLE" : "PROVIDER_TIMEOUT",
            isBreakerOpen 
              ? "Verification service is temporarily unavailable due to high error rates. Please try again in 30 seconds." 
              : "Connection to Cashfree API timed out. Please retry.",
            isBreakerOpen ? 503 : 504,
            isBreakerOpen ? 30 : undefined,
            requestId
          );
        }
      }

      return createErrorResponse(
        "INVALID_PROVIDER",
        `Unsupported provider: ${provider}`,
        400,
        undefined,
        requestId
      );
    }

    return createErrorResponse(
      "INVALID_MODE",
      "Invalid mode selection. Must be 'demo' or 'live'.",
      400,
      undefined,
      requestId
    );
  } catch (err: any) {
    console.error(`[API: msme-lookup] [Request ID: ${requestId}] Route handler crash:`, err);
    return createErrorResponse(
      "INTERNAL_ERROR",
      err.message || "An unexpected error occurred on the server.",
      500,
      undefined,
      requestId
    );
  }
}
