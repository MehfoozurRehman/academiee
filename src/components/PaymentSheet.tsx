import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatMoney, useTheme } from "../theme";
import { AppText, Button, ErrorNote, Field, Segmented } from "./ui";
import { Sheet } from "./Sheet";
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
  const t = useTheme();
  const recordPayment = useMutation(api.fees.recordPayment);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(String(balance));
      setMethod(METHODS[0]);
      setError("");
    }
  }, [open, balance]);

  async function submit() {
    if (!feeId) return;

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await recordPayment({ feeId, amount: value, paymentMethod: method });
      onClose();
    } catch (e) {
      setError(
        cleanError(e, "Payment failed")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Record payment">
      <View style={{ gap: t.spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <AppText variant="body" color={t.colors.textMuted}>
            {studentName}
          </AppText>
          <AppText variant="body" color={t.colors.danger}>
            {formatMoney(balance)} due
          </AppText>
        </View>

        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <View style={{ gap: 6 }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            METHOD
          </AppText>
          <Segmented
            value={method}
            onChange={setMethod}
            options={METHODS.map((m) => ({ label: m, value: m }))}
          />
        </View>

        <ErrorNote message={error} />

        <Button label="Save payment" onPress={submit} loading={busy} />
        <Button label="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}
