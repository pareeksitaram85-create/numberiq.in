import { describe, it, expect, beforeEach, vi } from "vitest";

// Each test needs a clean rate-limit map, so the module is re-imported per case.
async function freshGuard() {
  vi.resetModules();
  const mod = await import("../api-guard");
  return mod.guardPublicAiRoute;
}

const post = (headers: Record<string, string> = {}) =>
  new Request("https://numberiq.in/api/extract-invoice", { method: "POST", headers });

describe("guardPublicAiRoute", () => {
  beforeEach(() => {
    process.env.AUTOMATION_API_KEY = "test-key";
  });

  it("blocks a request with no Origin or Referer", async () => {
    const guard = await freshGuard();
    expect(guard(post())?.status).toBe(403);
  });

  it("blocks a foreign origin", async () => {
    const guard = await freshGuard();
    expect(guard(post({ origin: "https://evil.example" }))?.status).toBe(403);
  });

  it("does not treat a lookalike host as our own", async () => {
    const guard = await freshGuard();
    expect(guard(post({ origin: "https://numberiq.in.evil.example" }))?.status).toBe(403);
  });

  it("allows the live site", async () => {
    const guard = await freshGuard();
    expect(guard(post({ origin: "https://numberiq.in" }))).toBeNull();
  });

  it("allows a Referer when Origin is absent", async () => {
    const guard = await freshGuard();
    expect(guard(post({ referer: "https://numberiq.in/tools/invoice-to-tally" }))).toBeNull();
  });

  it("allows localhost during development", async () => {
    const guard = await freshGuard();
    expect(guard(post({ origin: "http://localhost:3000" }))).toBeNull();
  });

  it("lets the automation key through without an Origin", async () => {
    const guard = await freshGuard();
    expect(guard(post({ "x-numberiq-key": "test-key" }))).toBeNull();
  });

  it("does not accept a wrong automation key as a bypass", async () => {
    const guard = await freshGuard();
    expect(guard(post({ "x-numberiq-key": "wrong" }))?.status).toBe(403);
  });

  it("rate limits a single address after 30 calls in the window", async () => {
    const guard = await freshGuard();
    const headers = { origin: "https://numberiq.in", "x-forwarded-for": "203.0.113.7" };

    for (let i = 0; i < 30; i++) {
      expect(guard(post(headers))).toBeNull();
    }
    expect(guard(post(headers))?.status).toBe(429);
  });

  it("rate limits per address, not globally", async () => {
    const guard = await freshGuard();
    const busy = { origin: "https://numberiq.in", "x-forwarded-for": "203.0.113.7" };
    const quiet = { origin: "https://numberiq.in", "x-forwarded-for": "198.51.100.4" };

    for (let i = 0; i < 31; i++) guard(post(busy));

    expect(guard(post(busy))?.status).toBe(429);
    expect(guard(post(quiet))).toBeNull();
  });

  it("reads only the first hop of x-forwarded-for", async () => {
    const guard = await freshGuard();
    const spoofed = {
      origin: "https://numberiq.in",
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    };

    for (let i = 0; i < 31; i++) guard(post(spoofed));

    // Same real client, different trailing proxy hops — must still be the same bucket.
    expect(
      guard(post({ origin: "https://numberiq.in", "x-forwarded-for": "203.0.113.7, 10.9.9.9" }))
        ?.status
    ).toBe(429);
  });
});
