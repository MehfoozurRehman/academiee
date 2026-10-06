import { describe, expect, test } from "vitest";
import { checkPayment, feeBalance, feeStatus, localToday } from "./fees";

const base = { amount: 8000, discount: 0, paid: 0, dueDate: "2026-10-10" };

describe("feeStatus", () => {
  test("unpaid before the due date is due", () => {
    expect(feeStatus(base, "2026-10-05")).toBe("due");
  });
  test("unpaid on the due date is still due", () => {
    expect(feeStatus(base, "2026-10-10")).toBe("due");
  });
  test("unpaid after the due date turns overdue by itself", () => {
    expect(feeStatus(base, "2026-10-11")).toBe("overdue");
  });
  test("part paid before the due date is partial", () => {
    expect(feeStatus({ ...base, paid: 3000 }, "2026-10-05")).toBe("partial");
  });
  test("part paid after the due date is overdue", () => {
    expect(feeStatus({ ...base, paid: 3000 }, "2026-10-20")).toBe("overdue");
  });
  test("fully paid stays paid after the due date", () => {
    expect(feeStatus({ ...base, paid: 8000 }, "2026-12-01")).toBe("paid");
  });
  test("discount counts towards settling", () => {
    expect(feeStatus({ ...base, discount: 1000, paid: 7000 }, "2026-12-01")).toBe("paid");
  });
  test("voided wins over everything", () => {
    expect(feeStatus({ ...base, voided: true }, "2026-12-01")).toBe("voided");
  });
});

describe("feeBalance", () => {
  test("never goes negative", () => {
    expect(feeBalance({ amount: 5000, discount: 6000, paid: 0 })).toBe(0);
  });
});

describe("checkPayment", () => {
  test("accepts a payment up to the balance", () => {
    expect(() => checkPayment({ ...base, paid: 3000 }, 5000)).not.toThrow();
  });
  test("rejects overpayment", () => {
    expect(() => checkPayment({ ...base, paid: 3000 }, 5001)).toThrow(/more than the balance/);
  });
  test("rejects zero, negative and fractional amounts", () => {
    expect(() => checkPayment(base, 0)).toThrow();
    expect(() => checkPayment(base, -10)).toThrow();
    expect(() => checkPayment(base, 10.5)).toThrow();
  });
  test("rejects payments on a voided invoice", () => {
    expect(() => checkPayment({ ...base, voided: true }, 100)).toThrow(/voided/);
  });
});

test("localToday pads month and day", () => {
  expect(localToday(new Date(2026, 0, 5))).toBe("2026-01-05");
});
