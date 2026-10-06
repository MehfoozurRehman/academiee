// Pure fee rules shared by the server (Convex) and the app. No I/O here, so
// these are easy to test and can never disagree between screens.

export type FeeStatus = "paid" | "partial" | "due" | "overdue" | "voided";

export type FeeLike = {
  amount: number;
  discount: number;
  paid: number;
  /** YYYY-MM-DD */
  dueDate: string;
  voided?: boolean;
};

export function feeBalance(fee: Pick<FeeLike, "amount" | "discount" | "paid">) {
  return Math.max(0, fee.amount - fee.discount - fee.paid);
}

/**
 * Status is always derived from the numbers and today's date — never stored —
 * so an unpaid invoice turns "overdue" on its own once the due date passes.
 * `today` is YYYY-MM-DD in the academy's local time.
 */
export function feeStatus(fee: FeeLike, today: string): FeeStatus {
  if (fee.voided) return "voided";
  if (feeBalance(fee) === 0) return "paid";
  if (today > fee.dueDate) return "overdue";
  return fee.paid > 0 ? "partial" : "due";
}

/** Throws a user-facing message if a payment can't be applied. */
export function checkPayment(fee: FeeLike, amount: number) {
  if (fee.voided) throw new Error("This invoice has been voided.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (!Number.isInteger(amount)) throw new Error("Enter a whole amount in rupees.");
  const balance = feeBalance(fee);
  if (amount > balance) throw new Error(`Payment is more than the balance of Rs ${balance.toLocaleString("en-US")}.`);
}

/** "2026-10" for a YYYY-MM-DD date. */
export function monthOf(date: string) {
  return date.slice(0, 7);
}

/** Local calendar date as YYYY-MM-DD (the app passes this to queries). */
export function localToday(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
