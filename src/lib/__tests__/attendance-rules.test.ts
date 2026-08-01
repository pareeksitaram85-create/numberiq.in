import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

/**
 * The Face Attendance module ships as a single self-contained HTML file, so its payroll
 * rules cannot be imported directly. Rather than duplicate the maths here (and let the two
 * copies drift), this spec extracts the module's own core script and exercises it. If the
 * rules in the HTML change, these tests are what catch it.
 */

const MODULE_HTML = new URL("../../private-modules/attendance-face.html", import.meta.url);

/* eslint-disable @typescript-eslint/no-explicit-any */
let ctx: any;

function loadModuleCore() {
  const html = readFileSync(MODULE_HTML, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const core = scripts.find((s) => s.includes("var Att = {") && s.includes("var S = {"));
  if (!core) throw new Error("Could not find the attendance core script inside attendance-face.html");

  const sandbox: any = { console, Math, Date, JSON, parseFloat, parseInt, isNaN, Float32Array };
  sandbox.document = { getElementById: () => null, querySelectorAll: () => [] };
  createContext(sandbox);
  runInContext(core, sandbox);
  return sandbox;
}

/** Employee-day helper: punch times as "HH:MM" on the given date. */
function day(dateStr: string, times: string[], empOverrides: Record<string, unknown> = {}, holidays: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  const emp = {
    id: "e1",
    emp_code: "EMP001",
    full_name: "Test Employee",
    shift_start: "10:00",
    shift_end: "19:00",
    weekly_offs: [0, 6],
    ...empOverrides,
  };
  const punches = times.map((t) => ({
    employee_id: "e1",
    work_date: dateStr,
    punched_at: new Date(`${dateStr}T${t}:00`).toISOString(),
  }));
  return ctx.Att.day(emp, dateStr, punches, holidays, overrides);
}

/* 2026-08-03 is a Monday; 2026-08-01 Saturday; 2026-08-02 Sunday. */
const MON = "2026-08-03";
const TUE = "2026-08-04";
const SAT = "2026-08-01";
const SUN = "2026-08-02";

beforeAll(() => {
  ctx = loadModuleCore();
  ctx.S.settings = {
    office_in: "10:00",
    office_out: "19:00",
    grace_minutes: 15,
    full_day_hours: 8,
    half_day_hours: 6,
    weekly_offs: [0, 6],
    day_start_hour: 4,
  };
  ctx.S.holidays = [];
  ctx.S.overrides = [];
});

describe("day classification by hours worked", () => {
  it("marks a nine-hour day Present", () => {
    const d = day(MON, ["10:00", "19:00"]);
    expect(d.status).toBe("Present");
    expect(d.hours).toBeCloseTo(9, 5);
  });

  it("treats exactly eight hours as a full day", () => {
    expect(day(MON, ["10:00", "18:00"]).status).toBe("Present");
  });

  it("marks just under eight hours a Half Day", () => {
    expect(day(MON, ["10:00", "17:59"]).status).toBe("Half Day");
  });

  it("treats exactly six hours as a Half Day", () => {
    expect(day(MON, ["10:00", "16:00"]).status).toBe("Half Day");
  });

  it("marks just under six hours Absent", () => {
    const d = day(MON, ["10:00", "15:59"]);
    expect(d.status).toBe("Absent");
    expect(d.remark).toMatch(/below half-day threshold/);
  });

  it("uses only the first and last scan of the day", () => {
    const d = day(MON, ["10:00", "13:15", "14:00", "19:00"]);
    expect(d.hours).toBeCloseTo(9, 5);
    expect(d.punchCount).toBe(4);
    expect(d.status).toBe("Present");
  });
});

describe("incomplete days", () => {
  it("flags a single scan as Missing Punch rather than silently absent", () => {
    const d = day(MON, ["10:05"]);
    expect(d.status).toBe("Missing Punch");
    expect(d.hours).toBe(0);
    expect(ctx.Att.payable(d.status)).toBe(0);
  });

  it("records no scans at all as Absent", () => {
    const d = day(MON, []);
    expect(d.status).toBe("Absent");
    expect(d.remark).toBe("No punch recorded");
  });
});

describe("late arrival and the grace window", () => {
  it("does not flag arrival exactly on the grace boundary", () => {
    expect(day(MON, ["10:15", "19:00"]).late).toBe(false);
  });

  it("flags arrival one minute past the grace window", () => {
    const d = day(MON, ["10:16", "19:00"]);
    expect(d.late).toBe(true);
    expect(d.lateBy).toBe(16);
  });

  it("measures lateness from the employee's own shift, not the office default", () => {
    const d = day(MON, ["11:05", "19:00"], { shift_start: "11:00" });
    expect(d.late).toBe(false);
  });

  it("never flags a holiday or weekly off as late", () => {
    expect(day(SUN, ["12:30", "19:00"]).late).toBe(false);
  });
});

describe("holidays and weekly offs are paid, not Present", () => {
  it("marks Saturday and Sunday as Weekly Off", () => {
    expect(day(SAT, []).status).toBe("Weekly Off");
    expect(day(SUN, []).status).toBe("Weekly Off");
  });

  it("honours a per-employee weekly-off pattern over the org default", () => {
    expect(day(SAT, [], { weekly_offs: [0] }).status).toBe("Absent");
    expect(day(SUN, [], { weekly_offs: [0] }).status).toBe("Weekly Off");
  });

  it("marks a holiday date as Holiday", () => {
    const d = day(TUE, [], {}, { [TUE]: { name: "Independence Day", kind: "public" } });
    expect(d.status).toBe("Holiday");
    expect(d.remark).toBe("Independence Day");
  });

  it("records hours when someone works on a holiday but keeps the day a Holiday", () => {
    const d = day(TUE, ["10:00", "19:00"], {}, { [TUE]: { name: "Diwali", kind: "public" } });
    expect(d.status).toBe("Holiday");
    expect(d.hours).toBeCloseTo(9, 5);
    expect(d.remark).toMatch(/Worked on holiday/);
  });

  it("pays holidays and weekly offs at full weight but never counts them as Present", () => {
    expect(ctx.Att.payable("Holiday")).toBe(1);
    expect(ctx.Att.payable("Weekly Off")).toBe(1);
    expect(ctx.Att.payable("Present")).toBe(1);
    expect(ctx.Att.payable("Half Day")).toBe(0.5);
    expect(ctx.Att.payable("Absent")).toBe(0);
    expect(ctx.Att.payable("Missing Punch")).toBe(0);
  });
});

describe("regularisation overrides", () => {
  it("lets an admin override the computed status and records the reason", () => {
    const d = day(MON, ["10:00"], {}, {}, {
      "e1|2026-08-03": { status: "Present", in_time: "10:00", out_time: "19:00", reason: "Forgot to punch out" },
    });
    expect(d.status).toBe("Present");
    expect(d.hours).toBeCloseTo(9, 5);
    expect(d.remark).toMatch(/Regularised — Forgot to punch out/);
  });

  it("an override wins over a holiday", () => {
    const d = day(TUE, [], {}, { [TUE]: { name: "Diwali", kind: "public" } }, {
      "e1|2026-08-04": { status: "On Duty", reason: "Client visit" },
    });
    expect(d.status).toBe("On Duty");
  });
});

describe("joining date and day rollover", () => {
  it("excludes days before the employee joined", () => {
    const d = day(MON, [], { date_of_joining: "2026-09-01" });
    expect(d.status).toBe("Not Joined");
    expect(ctx.Att.payable(d.status)).toBe(0);
  });

  it("attributes a post-midnight punch to the previous working day", () => {
    expect(ctx.workDateOf(new Date("2026-08-04T01:30:00"))).toBe("2026-08-03");
    expect(ctx.workDateOf(new Date("2026-08-04T05:30:00"))).toBe("2026-08-04");
  });
});

describe("monthly summary arithmetic", () => {
  it("totals payable days as Present + half of Half Day + paid non-working days", () => {
    const emp = {
      id: "e1",
      emp_code: "EMP001",
      full_name: "Test",
      shift_start: "10:00",
      shift_end: "19:00",
      weekly_offs: [0, 6],
    };
    const punches = [
      { employee_id: "e1", work_date: MON, punched_at: new Date(`${MON}T10:00:00`).toISOString() },
      { employee_id: "e1", work_date: MON, punched_at: new Date(`${MON}T19:00:00`).toISOString() },
      { employee_id: "e1", work_date: TUE, punched_at: new Date(`${TUE}T10:40:00`).toISOString() },
      { employee_id: "e1", work_date: TUE, punched_at: new Date(`${TUE}T17:00:00`).toISOString() },
    ];
    const mx = ctx.Att.matrix([emp], SAT, "2026-08-05", punches);
    const s = ctx.Att.summarise(mx.cells["e1"], mx.dates);

    // Sat + Sun off, Mon present (9h), Tue half day (6h20m, late), Wed absent
    expect(s.weekoff).toBe(2);
    expect(s.present).toBe(1);
    expect(s.half).toBe(1);
    expect(s.absent).toBe(1);
    expect(s.late).toBe(1);
    expect(s.working).toBe(3);
    expect(s.payable).toBe(1 + 0.5 + 2);
  });
});
