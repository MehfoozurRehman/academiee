import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  Icon,
  Pressable,
  Reveal,
  Screen,
  Section,
  Skeleton,
  Text,
  type Tone,
} from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { useToday } from "../../lib/useToday";
import { openWhatsApp } from "../../lib/whatsapp";
import { useTheme } from "../../theme/ThemeProvider";
import { space } from "../../theme/tokens";

const FEE_TONE: Record<string, Tone> = { paid: "success", partial: "warning", due: "neutral", overdue: "danger", voided: "neutral" };

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "success" | "danger" | "text" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text latin variant="label" weight={strong ? "bold" : "medium"} color={tone ?? "text"} tabular>
        {value}
      </Text>
    </View>
  );
}

export default function StudentFees() {
  const { t, money, monthLabel, dateLabel } = useI18n();
  const { colors } = useTheme();
  const { today } = useToday();
  const invoices = useQuery(api.portal.fees, { today });
  const home = useQuery(api.portal.home, { today });
  const [open, setOpen] = useState<string | null>(null);

  const outstanding = (invoices ?? []).reduce((s, i) => s + (i.status === "voided" ? 0 : i.balance), 0);
  const contact = home?.academy.whatsapp || home?.academy.phone || null;

  return (
    <Screen title={t("portal.feesTitle")} subtitle={t("portal.feesSubtitle")} narrow>
      {invoices === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={100} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Card tone={outstanding === 0 ? "muted" : "surface"} style={{ gap: space.xs }}>
                <Text variant="caption" color="textMuted">
                  {t("portal.totalOutstanding")}
                </Text>
                {outstanding === 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <Icon name="check-circle" size={20} color="success" />
                    <Text variant="heading" color="success">
                      {t("student.allPaid")}
                    </Text>
                  </View>
                ) : (
                  <Text latin variant="figure" tabular color="danger">
                    {money(outstanding)}
                  </Text>
                )}
              </Card>
            </Section>
          </Reveal>

          <Reveal index={1}>
            <Section>
              {invoices.length === 0 ? (
                <EmptyState icon="credit-card" title={t("portal.noInvoices")} body={t("portal.noInvoicesBody")} />
              ) : (
                <View style={{ gap: space.md }}>
                  {invoices.map((inv) => {
                    const expanded = open === inv._id;
                    const voided = inv.status === "voided";
                    return (
                      <View
                        key={inv._id}
                        style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded }}
                          onPress={() => setOpen(expanded ? null : inv._id)}
                          scaleTo={0.99}
                          style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }}
                        >
                          <View style={{ flex: 1, gap: space.xs }}>
                            <Text weight="semibold">{monthLabel(inv.month)}</Text>
                            <Text variant="caption" color="textMuted">
                              {t("portal.dueOn", { date: dateLabel(inv.dueDate) })}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end", gap: space.xs }}>
                            <Text
                              latin
                              weight="bold"
                              tabular
                              color={voided ? "textFaint" : inv.balance > 0 ? "text" : "success"}
                              style={voided ? { textDecorationLine: "line-through" } : undefined}
                            >
                              {money(voided ? inv.amount : inv.balance > 0 ? inv.balance : inv.amount)}
                            </Text>
                            <Badge label={t(`status.${inv.status}` as never)} tone={FEE_TONE[inv.status] ?? "neutral"} />
                          </View>
                          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} color="textFaint" />
                        </Pressable>

                        {expanded ? (
                          <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md }}>
                            <Divider />
                            <View style={{ gap: space.sm }}>
                              <Line label={t("portal.amountLabel")} value={money(inv.amount)} />
                              {inv.discount > 0 ? <Line label={t("portal.discountLabel")} value={`- ${money(inv.discount)}`} /> : null}
                              <Line label={t("portal.paidLabel")} value={money(inv.paid)} tone="success" />
                              <Line label={t("portal.balanceLabel")} value={money(inv.balance)} strong tone={inv.balance > 0 ? "danger" : "text"} />
                            </View>
                            <Text variant="label" weight="semibold">
                              {t("portal.paymentsTitle")}
                            </Text>
                            {inv.payments.length === 0 ? (
                              <Text variant="caption" color="textFaint">
                                {t("portal.noPayments")}
                              </Text>
                            ) : (
                              inv.payments.map((p) => (
                                <Pressable
                                  key={p.paymentId}
                                  accessibilityRole="link"
                                  onPress={() => router.push(`/receipt/${p.paymentId}` as never)}
                                  style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.xs }}
                                >
                                  <Icon name="file-text" size={18} color="accent" />
                                  <View style={{ flex: 1 }}>
                                    <Text variant="label" weight="semibold">
                                      {t("portal.receipt", { no: p.receiptNo })}
                                    </Text>
                                    <Text variant="caption" color="textMuted">
                                      {dateLabel(p.date)}
                                    </Text>
                                  </View>
                                  <Text latin variant="label" weight="semibold" color="success" tabular>
                                    {money(p.amount)}
                                  </Text>
                                  <Icon name="chevron-right" size={16} color="textFaint" />
                                </Pressable>
                              ))
                            )}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </Section>
          </Reveal>

          {contact && home ? (
            <Reveal index={2}>
              <Card tone="muted" style={{ gap: space.md }}>
                <View style={{ gap: 2 }}>
                  <Text variant="label" weight="semibold">
                    {t("portal.contactTitle")}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {t("portal.contactBody")}
                  </Text>
                  <Text latin variant="caption" color="textMuted">
                    {contact}
                  </Text>
                </View>
                <Button
                  size="sm"
                  icon="message-circle"
                  label={t("portal.contactWhatsApp")}
                  onPress={() => void openWhatsApp(contact, t("portal.contactMessage", { name: home.student.name, code: home.student.code }))}
                />
              </Card>
            </Reveal>
          ) : null}
        </>
      )}
    </Screen>
  );
}
