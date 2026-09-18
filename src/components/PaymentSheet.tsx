import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMoney } from "../theme";
import { FormSheet } from "./FormSheet";
import { cleanError } from "../lib/errors";

const METHODS = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa"];

export function PaymentSheet({
  open,
  feeId,
  studentName,
  balance,
  onClose,
}: {
  open: boolean;
  feeId: Id<"fees"> | null;
  studentName: string;
  balance: number;
  onClose: () => void;
}) {
  const recordPayment = useMutation(api.fees.recordPayment);

  const [values, setValues] = useState<Record<string, string>>({
    amount: "",
    method: METHODS[0],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues({ amount: String(balance), method: METHODS[0] });
      setError("");
    }
  }, [open, balance]);

  async function submit() {
    if (!feeId) return;

    const value = Number(values.amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await recordPayment({ feeId, amount: value, paymentMethod: values.method });
      onClose();
    } catch (e) {
      setError(cleanError(e, "Payment failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="Record payment"
      note={`${studentName} · ${formatMoney(balance)} due`}
      values={values}
      onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
      submitLabel="Save payment"
      onSubmit={submit}
      busy={busy}
      error={error}
      choices={[
        {
          key: "method",
          label: "Method",
          options: METHODS.map((m) => ({ label: m, value: m })),
        },
      ]}
      fields={[{ key: "amount", label: "Amount", keyboard: "numeric" }]}
    />
  );
}
