import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  retryAfter?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 500,
  retryAfter?: number,
  requestId?: string
) {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(retryAfter !== undefined && { retryAfter }),
    },
    ...(requestId && { requestId }),
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (retryAfter !== undefined) {
    headers["Retry-After"] = String(retryAfter);
  }

  return NextResponse.json(payload, { status, headers });
}

// Simple in-memory rate limiter using Map (survives requests inside same container)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// Evict expired entries periodically so the map cannot grow without bound
// on long-lived containers (one entry per unique client IP otherwise).
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPruneAt = 0;

function pruneExpiredEntries(now: number) {
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;
  for (const [ip, state] of ipRequestCounts) {
    if (now > state.resetTime) ipRequestCounts.delete(ip);
  }
}

export function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000) {
  const now = Date.now();
  pruneExpiredEntries(now);
  const state = ipRequestCounts.get(ip);

  // If no entry or window has expired, reset
  if (!state || now > state.resetTime) {
    ipRequestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
      retryAfter: 0,
    };
  }

  // If limit exceeded
  if (state.count >= limit) {
    const retryAfter = Math.ceil((state.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil(state.resetTime / 1000),
      retryAfter: retryAfter > 0 ? retryAfter : 1,
    };
  }

  // Increment count
  state.count += 1;
  return {
    allowed: true,
    remaining: limit - state.count,
    reset: Math.ceil(state.resetTime / 1000),
    retryAfter: 0,
  };
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

// Global registry of request loggers to attach a unique ID
export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}
