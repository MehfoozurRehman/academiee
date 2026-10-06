// Fees, receipts and expenses strings. `ur` must have exactly the same keys as `en` (TypeScript
// checks it). Urdu is written in Urdu script, never Roman Urdu.
import type { Widen } from "../types";

export const en = {
  fees: {
    generate: "Generate fees",
    generated: "{count} invoices created",
  },
  receipt: {},
  expenses: {},
};

export const ur: Widen<typeof en> = {
  fees: {
    generate: "فیس بنائیں",
    generated: "{count} انوائس بن گئیں",
  },
  receipt: {},
  expenses: {},
};
