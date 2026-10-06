import { createElement } from "react";
import { Platform, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge, Button, Card, EmptyState, Reveal, Screen, Skeleton, Text } from "../../components/ui";
import { useI18n, type TKey } from "../../i18n/I18nProvider";
import { openWhatsApp } from "../../lib/whatsapp";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";

// Hides the buttons and forces ink-on-paper colours when printing.
const PRINT_CSS = `@media print {
  [data-noprint] { display: none !important; }
  html, body, #root, #root * { background: #fff !important; color: #111 !important; box-shadow: none !important; }
}`;

function Dashed() {
  const { colors } = useTheme();
  return (
    <View style={{ height: 1, overflow: "hidden" }}>
      <View style={{ height: 2, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong }} />
    </View>
  );
}

function Row({ label, value, latin }: { label: string; value: string; latin?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.lg }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text latin={latin} tabular={latin} weight="medium" style={{ flexShrink: 1 }} align="end">
        {value}
      </Text>
    </View>
  );
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/" as never);
}

export default function Receipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, money, monthLabel, dateLabel } = useI18n();
  const { colors } = useTheme();
  const { isLoading, isAuthenticated } = useConvexAuth();

  const r = useQuery(api.fees.receipt, isAuthenticated ? { paymentId: id as Id<"payments"> } : "skip");

  if (!isLoading && !isAuthenticated) return <Redirect href="/welcome" />;

  function share() {
    if (!r) return;
    let text = t("receipt.shareText", {
      academy: r.academy.name,
      number: r.receiptNo,
      name: r.student.name,
      code: r.student.code,
      month: r.month ? monthLabel(r.month) : "—",
      amount: money(r.amount),
      method: t(`fees.method_${r.method}` as TKey),
      date: dateLabel(r.date),
      balance: money(r.balanceAfter),
    });
    if (r.voided) text += `\n${t("receipt.shareVoided")}`;
    void openWhatsApp("", text);
  }

  const actions = (
    <View
      {...(Platform.OS === "web" ? ({ dataSet: { noprint: "1" } } as object) : {})}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center", marginTop: space.xl }}
    >
      <Button variant="secondary" icon="arrow-left" label={t("receipt.back")} onPress={goBack} />
      {Platform.OS === "web" ? (
        <Button variant="secondary" icon="printer" label={t("receipt.print")} onPress={() => window.print()} />
      ) : null}
      {r ? <Button icon="message-circle" label={t("receipt.share")} onPress={share} /> : null}
    </View>
  );

  return (
    <Screen narrow>
      {Platform.OS === "web" ? createElement("style", null, PRINT_CSS) : null}

      {r === undefined ? (
        <View style={{ gap: space.md, maxWidth: 480, width: "100%", alignSelf: "center" }}>
          <Skeleton height={460} />
        </View>
      ) : r === null ? (
        <EmptyState icon="file-text" title={t("common.notFound")} />
      ) : (
        <Reveal index={0}>
          <View style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}>
            <Card padded={false}>
              <View style={{ padding: space.xl, gap: space.lg }}>
                <View style={{ alignItems: "center", gap: 2 }}>
                  <Text variant="heading" align="center">
                    {r.academy.name}
                  </Text>
                  {r.academy.city ? (
                    <Text variant="caption" color="textMuted" align="center">
                      {r.academy.city}
                    </Text>
                  ) : null}
                  {r.academy.phone ? (
                    <Text latin tabular variant="caption" color="textMuted" align="center">
                      {r.academy.phone}
                    </Text>
                  ) : null}
                </View>

                <Dashed />

                <View style={{ alignItems: "center", gap: space.xs }}>
                  <Text variant="label" color="textMuted" align="center">
                    {t("receipt.title")}
                  </Text>
                  <Text latin tabular variant="heading" align="center">
                    {t("receipt.number", { number: r.receiptNo })}
                  </Text>
                  {r.voided ? <Badge label={t("receipt.voided")} tone="danger" /> : null}
                </View>

                <View style={{ alignItems: "center", gap: space.xs, paddingVertical: space.sm }}>
                  <Text variant="caption" color="textMuted" align="center">
                    {t("receipt.amountReceived")}
                  </Text>
                  <Text
                    latin
                    tabular
                    variant="figure"
                    align="center"
                    color={r.voided ? "textFaint" : "text"}
                    style={[{ fontSize: 40, lineHeight: 46 }, r.voided ? { textDecorationLine: "line-through" } : null]}
                  >
                    {money(r.amount)}
                  </Text>
                </View>

                <Dashed />

                <View style={{ gap: space.md }}>
                  <Row label={t("receipt.date")} value={dateLabel(r.date)} />
                  <Row label={t("receipt.student")} value={r.student.name} />
                  <Row label="ID" value={r.student.code} latin />
                  {r.student.fatherName ? <Row label={t("receipt.father")} value={r.student.fatherName} /> : null}
                  {r.month ? <Row label={t("receipt.forMonth")} value={monthLabel(r.month)} /> : null}
                  <Row label={t("receipt.method")} value={t(`fees.method_${r.method}` as TKey)} />
                  <Row label={t("receipt.balanceRemaining")} value={money(r.balanceAfter)} latin />
                </View>

                {r.voided ? (
                  <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft }}>
                    <Text variant="caption" color="danger">
                      {t("receipt.voidedReason", { reason: r.voidReason ?? "—" })}
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" color="textFaint" align="center">
                    {t("receipt.thanks")}
                  </Text>
                )}
              </View>

              {r.voided ? (
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", top: 0, bottom: 0, start: 0, end: 0, alignItems: "center", justifyContent: "center" }}
                >
                  <View
                    style={{
                      transform: [{ rotate: "-18deg" }],
                      borderWidth: 4,
                      borderColor: colors.danger,
                      borderRadius: radius.md,
                      paddingHorizontal: space.xl,
                      paddingVertical: space.sm,
                      opacity: 0.35,
                    }}
                  >
                    <Text variant="title" color="danger" weight="bold" style={{ letterSpacing: 4 }}>
                      {t("receipt.voided").toUpperCase()}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>
            {actions}
          </View>
        </Reveal>
      )}
    </Screen>
  );
}
