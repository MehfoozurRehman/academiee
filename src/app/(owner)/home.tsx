import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AcademySwitcher } from "../../components/OwnerNav";
import { CountUp } from "../../components/CountUp";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Icon,
  ListGroup,
  ListRow,
  Pressable,
  Progress,
  Reveal,
  Screen,
  Section,
  Skeleton,
  Text,
  useToast,
  type IconName,
} from "../../components/ui";
import { useAcademy, useAcademyId, useMe } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useToday } from "../../lib/useToday";
import { openWhatsApp } from "../../lib/whatsapp";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, radius, space } from "../../theme/tokens";

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? "dashboard.greetingMorning" : h < 17 ? "dashboard.greetingAfternoon" : "dashboard.greetingEvening";
}

function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <Card style={{ flex: 1, minWidth: 140, gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Icon name={icon} size={16} color="textMuted" />
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text latin variant="heading" weight="bold" tabular>
        {value}
      </Text>
    </Card>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flex: 1,
        minWidth: 140,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} color="accent" />
      </View>
      <Text variant="label" weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Shown to a brand-new academy until the basics are in place. */
function GettingStarted({ hasBatches, hasStudents }: { hasBatches: boolean; hasStudents: boolean }) {
  const { t } = useI18n();
  const steps = [
    { done: hasBatches, title: t("home.step1"), body: t("home.step1Body"), href: "/classes" },
    { done: hasStudents, title: t("home.step2"), body: t("home.step2Body"), href: "/students/new" },
    { done: false, title: t("home.step3"), body: t("home.step3Body"), href: "/fees" },
  ];
  const next = steps.findIndex((s) => !s.done);
  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading">{t("home.gettingStarted")}</Text>
        <Text variant="caption" color="textMuted">
          {t("home.gettingStartedBody")}
        </Text>
      </View>
      {steps.map((s, i) => (
        <Pressable key={s.href} onPress={() => router.push(s.href as never)} style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: s.done ? "transparent" : undefined,
            }}
          >
            <Icon name={s.done ? "check-circle" : i === next ? "arrow-right-circle" : "circle"} size={22} color={s.done ? "success" : i === next ? "accent" : "textFaint"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" weight="semibold" color={s.done ? "textMuted" : "text"} style={s.done ? { textDecorationLine: "line-through" } : undefined}>
              {s.title}
            </Text>
            <Text variant="caption" color="textMuted">
              {s.body}
            </Text>
          </View>
        </Pressable>
      ))}
    </Card>
  );
}

export default function Home() {
  const { t, money, monthLabel } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const me = useMe();
  const { academy } = useAcademy();
  const academyId = useAcademyId();
  const { today, month } = useToday();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;

  const data = useQuery(api.dashboard.summary, { academyId, month, today });
  const recent = useQuery(api.fees.recentPayments, { academyId });
  const generate = useMutation(api.fees.generateMonth);
  const [generating, setGenerating] = useState(false);

  const firstName = (me?.name ?? "").split(" ")[0];

  async function generateFees() {
    setGenerating(true);
    try {
      const res = await generate({ academyId, month });
      toast(t("fees.generated", { count: res.created }));
    } catch (e) {
      toast(errorMessage(e, t("common.somethingWrong")), "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Screen
      subtitle={`${t(greetingKey())}${firstName ? `, ${firstName}` : ""}`}
      title={academy?.name ?? ""}
      action={!wide ? <AcademySwitcher compact /> : undefined}
    >
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={150} />
          <Skeleton height={80} />
          <Skeleton height={220} />
        </View>
      ) : (
        <>
          {data.batches === 0 || data.activeStudents === 0 ? (
            <Reveal index={0}>
              <Section>
                <GettingStarted hasBatches={data.batches > 0} hasStudents={data.activeStudents > 0} />
              </Section>
            </Reveal>
          ) : null}

          {data.needsInvoices ? (
            <Reveal index={1}>
              <Section>
                <Card tone="muted" style={{ flexDirection: "row", alignItems: "center", gap: space.md, flexWrap: "wrap" }}>
                  <Icon name="file-plus" size={20} color="accent" />
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Text variant="label" weight="semibold">
                      {t("home.noInvoices", { month: monthLabel(month) })}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {t("home.noInvoicesBody")}
                    </Text>
                  </View>
                  <Button size="sm" label={t("fees.generate")} loading={generating} onPress={generateFees} />
                </Card>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={2}>
            <Section>
              <Card tone="accent" style={{ gap: space.lg, padding: space.xl }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md }}>
                  <View style={{ gap: space.xs, flex: 1 }}>
                    <Text variant="label" color="onAccent" style={{ opacity: 0.8 }}>
                      {t("dashboard.collected")} · {monthLabel(month)}
                    </Text>
                    <CountUp value={data.collected} format={money} variant="figure" color="onAccent" />
                  </View>
                  <Pressable
                    onPress={() => router.push("/fees")}
                    accessibilityRole="button"
                    style={{ paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.16)" }}
                  >
                    <Text variant="label" weight="semibold" color="onAccent">
                      {t("nav.fees")}
                    </Text>
                  </Pressable>
                </View>
                <View style={{ gap: space.sm }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${data.expected ? Math.min(100, (data.collected / data.expected) * 100) : 0}%`,
                        backgroundColor: colors.onAccent,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: space.sm }}>
                    <Text variant="caption" color="onAccent" style={{ opacity: 0.85 }}>
                      {t("dashboard.ofExpected", { amount: money(data.expected) })}
                    </Text>
                    <Text variant="caption" weight="semibold" color="onAccent">
                      {t("dashboard.outstanding")}: {money(data.outstanding)}
                    </Text>
                  </View>
                </View>
              </Card>
            </Section>
          </Reveal>

          <Reveal index={3}>
            <Section>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
                <Stat icon="users" label={t("dashboard.activeStudents")} value={String(data.activeStudents)} />
                <Stat
                  icon="check-square"
                  label={t("dashboard.attendanceRate")}
                  value={data.attendanceRate === null ? "—" : `${data.attendanceRate}%`}
                />
                <Stat icon="trending-up" label={t("home.net")} value={money(data.net)} />
              </View>
            </Section>
          </Reveal>

          <View style={{ flexDirection: wide ? "row" : "column", gap: wide ? space.xl : 0, alignItems: "flex-start" }}>
            <View style={{ flex: 1, width: "100%" }}>
              <Reveal index={4}>
                <Section
                  title={t("dashboard.needsFollowUp")}
                  action={data.counts.overdue > 0 ? <Text variant="caption" color="danger" weight="semibold">{t("dashboard.overdueCount", { count: data.counts.overdue })}</Text> : undefined}
                >
                  {data.followUps.length === 0 ? (
                    <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
                      <Icon name="smile" size={20} color="success" />
                      <Text color="textMuted" style={{ flex: 1 }}>
                        {t("home.noFollowUps")}
                      </Text>
                    </Card>
                  ) : (
                    <ListGroup>
                      {data.followUps.map((f) => (
                        <ListRow
                          key={f.invoiceId}
                          leading={<Avatar name={f.studentName} size={36} />}
                          title={f.studentName}
                          subtitle={`${f.studentCode} · ${money(f.balance)}`}
                          onPress={() => router.push(`/students/${f.studentId}` as never)}
                          chevron={false}
                          trailing={
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={t("whatsapp.send")}
                              onPress={() =>
                                openWhatsApp(
                                  f.parentPhone,
                                  t("whatsapp.overdue", { name: f.studentName, amount: money(f.balance), academy: academy?.name ?? "" })
                                )
                              }
                              style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.successSoft }}
                            >
                              <Icon name="message-circle" size={18} color="success" />
                            </Pressable>
                          }
                        />
                      ))}
                    </ListGroup>
                  )}
                </Section>
              </Reveal>

              <Reveal index={5}>
                <Section title={t("home.todaysClasses")}>
                  {data.todaysClasses.length === 0 ? (
                    <Card>
                      <Text color="textMuted">{t("student.noClassToday")}</Text>
                    </Card>
                  ) : (
                    <ListGroup>
                      {data.todaysClasses.map((c) => (
                        <ListRow
                          key={c.batchId}
                          leading={
                            <View style={{ width: 56 }}>
                              <Text latin variant="label" weight="bold" tabular>
                                {c.startTime}
                              </Text>
                              <Text latin variant="caption" color="textFaint" tabular>
                                {c.endTime}
                              </Text>
                            </View>
                          }
                          title={c.name}
                          subtitle={`${c.courseName} · ${c.teacherName}`}
                          trailing={<Text variant="caption" color="textMuted">{t("students.count", { count: c.enrolled })}</Text>}
                          onPress={() => router.push(`/attendance?batch=${c.batchId}` as never)}
                        />
                      ))}
                    </ListGroup>
                  )}
                </Section>
              </Reveal>
            </View>

            <View style={{ width: wide ? 300 : "100%" }}>
              <Reveal index={6}>
                <Section title={t("dashboard.quickActions")}>
                  <View style={{ flexDirection: wide ? "column" : "row", flexWrap: "wrap", gap: space.sm }}>
                    <QuickAction icon="dollar-sign" label={t("dashboard.recordPayment")} onPress={() => router.push("/fees")} />
                    <QuickAction icon="check-square" label={t("dashboard.markAttendance")} onPress={() => router.push("/attendance")} />
                    <QuickAction icon="user-plus" label={t("dashboard.addStudent")} onPress={() => router.push("/students/new")} />
                    <QuickAction icon="bell" label={t("dashboard.sendNotice")} onPress={() => router.push("/notices")} />
                  </View>
                </Section>
              </Reveal>
              <Reveal index={7}>
                <Section title={t("dashboard.recentPayments")}>
                  {recent === undefined ? (
                    <Skeleton height={120} />
                  ) : recent.length === 0 ? (
                    <Card>
                      <Text color="textMuted">{t("home.noPayments")}</Text>
                    </Card>
                  ) : (
                    <ListGroup>
                      {recent.slice(0, 5).map((p) => (
                        <ListRow
                          key={p._id}
                          title={p.studentName}
                          subtitle={`#${p.receiptNo} · ${p.date}`}
                          trailing={
                            <Text latin variant="label" weight="semibold" color={p.voided ? "textFaint" : "success"} style={p.voided ? { textDecorationLine: "line-through" } : undefined}>
                              {money(p.amount)}
                            </Text>
                          }
                          onPress={() => router.push(`/receipt/${p._id}` as never)}
                          chevron={false}
                        />
                      ))}
                    </ListGroup>
                  )}
                </Section>
              </Reveal>
            </View>
          </View>
        </>
      )}
      {data === null ? <EmptyState icon="alert-circle" title={t("common.somethingWrong")} /> : null}
    </Screen>
  );
}
