import { describe, it, expect, afterEach } from "vitest";
import { requireAutomationKey } from "../automation-auth";

const req = (key?: string) =>
  new Request("https://numberiq.in/api/classify-document", {
    method: "POST",
    headers: key ? { "x-numberiq-key": key } : {},
  });

const original = process.env.AUTOMATION_API_KEY;
afterEach(() => {
  if (original === undefined) delete process.env.AUTOMATION_API_KEY;
  else process.env.AUTOMATION_API_KEY = original;
});

describe("requireAutomationKey", () => {
  it("lets the automation through with the right key", () => {
    process.env.AUTOMATION_API_KEY = "s3cret-key";
    expect(requireAutomationKey(req("s3cret-key"))).toBeNull();
  });

  it("rejects a missing, wrong or differently-sized key with 401", () => {
    process.env.AUTOMATION_API_KEY = "s3cret-key";
    expect(requireAutomationKey(req())?.status).toBe(401);
    expect(requireAutomationKey(req("wrong-key!"))?.status).toBe(401);
    expect(requireAutomationKey(req("short"))?.status).toBe(401);
    expect(requireAutomationKey(req("s3cret-key-plus-extra"))?.status).toBe(401);
  });

  it("fails closed with 503 when no key is configured, rather than allowing everyone", () => {
    delete process.env.AUTOMATION_API_KEY;
    expect(requireAutomationKey(req("anything"))?.status).toBe(503);
  });
});
