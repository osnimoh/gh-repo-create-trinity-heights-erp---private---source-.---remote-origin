import { describe, it, expect } from "vitest";
import { computeInvoiceAmounts, FLOOR_RATE } from "@/lib/fees/net-fee";

// The entrenched 10% net-fee floor. These run locally (no DB) and are the
// first line of defence; the DB CHECK is the backstop.
describe("net-fee floor", () => {
  it("charges the full fee when there is no scholarship", () => {
    const r = computeInvoiceAmounts(5000, []);
    expect(r).toEqual({ standard: 5000, discount: 0, net: 5000 });
  });

  it("applies a single percentage scholarship", () => {
    const r = computeInvoiceAmounts(5000, [{ kind: "percentage", value: 25 }]);
    expect(r.discount).toBe(1250);
    expect(r.net).toBe(3750);
  });

  it("applies a fixed scholarship", () => {
    const r = computeInvoiceAmounts(5000, [{ kind: "fixed", value: 1000 }]);
    expect(r.net).toBe(4000);
  });

  it("stacks scholarships (50% + 30% = 80% off)", () => {
    const r = computeInvoiceAmounts(5000, [
      { kind: "percentage", value: 50 },
      { kind: "percentage", value: 30 },
    ]);
    expect(r.net).toBe(1000); // 20% of 5000
  });

  it("CAPS stacked scholarships at the 10% floor (80% + 30% = 110%)", () => {
    const r = computeInvoiceAmounts(5000, [
      { kind: "percentage", value: 80 },
      { kind: "percentage", value: 30 },
    ]);
    expect(r.net).toBe(500); // floored at 10% of 5000
    expect(r.discount).toBe(4500);
  });

  it("a 100% scholarship still leaves 10% payable", () => {
    const r = computeInvoiceAmounts(5000, [{ kind: "percentage", value: 100 }]);
    expect(r.net).toBe(500);
  });

  it("a fixed amount exceeding 90% is capped to the floor", () => {
    const r = computeInvoiceAmounts(5000, [{ kind: "fixed", value: 9999 }]);
    expect(r.net).toBe(500);
  });

  it("combines a percentage and a fixed amount", () => {
    const r = computeInvoiceAmounts(5000, [
      { kind: "percentage", value: 50 }, // -2500
      { kind: "fixed", value: 1000 }, // -1000
    ]);
    expect(r.net).toBe(1500);
  });

  it("never drops below 10% even with awkward rounding", () => {
    const r = computeInvoiceAmounts(100.04, [
      { kind: "percentage", value: 100 },
    ]);
    // 10% of 100.04 = 10.004 → floor rounds UP to 10.01
    expect(r.net).toBeGreaterThanOrEqual(100.04 * FLOOR_RATE);
    expect(r.net).toBe(10.01);
  });

  it("ignores non-positive scholarship values", () => {
    const r = computeInvoiceAmounts(5000, [
      { kind: "percentage", value: 0 },
      { kind: "fixed", value: -100 },
    ]);
    expect(r.net).toBe(5000);
  });

  it("holds the floor invariant across many combinations", () => {
    const standards = [1, 100, 333.33, 5000, 12345.67];
    const scholar: { kind: "percentage" | "fixed"; value: number }[][] = [
      [{ kind: "percentage", value: 95 }],
      [{ kind: "percentage", value: 100 }],
      [
        { kind: "percentage", value: 60 },
        { kind: "fixed", value: 99999 },
      ],
      [{ kind: "fixed", value: 1e9 }],
    ];
    for (const s of standards) {
      for (const combo of scholar) {
        const r = computeInvoiceAmounts(s, combo);
        expect(r.net).toBeGreaterThanOrEqual(
          Math.round(s * FLOOR_RATE * 100) / 100 - 0.0001,
        );
        expect(r.net).toBeLessThanOrEqual(r.standard);
        expect(Math.round((r.discount + r.net) * 100) / 100).toBe(r.standard);
      }
    }
  });
});
