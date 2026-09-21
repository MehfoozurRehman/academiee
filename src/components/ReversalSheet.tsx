import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMoney } from "../theme";
import { FormSheet } from "./FormSheet";
import { cleanError } from "../lib/errors";

export function ReversalSheet({
  open,
  feeId,
  studentName,
  amountPaid,
  onClose,
}: {
  open: boolean;
  feeId: Id<"fees"> | null;
  studentName: string;
  amountPaid: number;
  onClose: () => void;
}) {
  const reversePayment = useMutation(api.fees.reversePayment);

  const [values, setValues] = useState<Record<string, string>>({
    amount: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues({ amount: String(amountPaid) });
      setError("");
    }
  }, [open, amountPaid]);

  async function submit() {
    if (!feeId) return;

    const value = Number(values.amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (value > amountPaid) {
      setError(`Cannot reverse more than ${formatMoney(amountPaid)} paid`);
      return;
    }

    setBusy(true);
    setError("");

    try {
      await reversePayment({ feeId, amount: value });
      onClose();
    } catch (e) {
      setError(cleanError(e, "Reversal failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="Reverse payment"
      note={`${studentName} · ${formatMoney(amountPaid)} paid`}
      values={values}
      onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
      submitLabel="Reverse payment"
      onSubmit={submit}
      busy={busy}
      error={error}
      fields={[{ key: "amount", label: "Amount to reverse", keyboard: "numeric" }]}
    />
  );
}
