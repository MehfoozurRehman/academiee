import { View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Badge,
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
  type Tone,
} from "../../components/ui";
import { useMe } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { useToday } from "../../lib/useToday";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";

const FEE_TONE: Record<string, Tone> = { paid: "success", partial: "warning", due: "neutral", overdue: "danger", voided: "neutral" };

export default function StudentHome() {
  const { t, money, dayName, monthLabel, dateLabel } = useI18n();
  const { colors } = useTheme();
  const me = useMe();
  const { today } = useToday();
  const data = useQuery(api.portal.home, { today });

  const firstName = (me?.student?.name ?? "").split(" ")[0];
  const rate = data?.attendanceRate ?? null;
  const rateTone: Tone = rate === null ? "accent" : rate >= 85 ? "success" : rate >= 70 ? "warning" : "danger";

  return (
    <Screen title={t("student.home", { name: firstName })} subtitle={me?.student?.academyName}>
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={130} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </View>
      ) : (
        <>
          {/* Today */}
          <Reveal index={0}>
            <Section title={t("portal.todayTitle")}>
              {data.todaysSlots.length > 0 ? (
                <ListGroup>
                  {data.todaysSlots.map((s) => (
                    <ListRow
                      key={s._id}
                      leading={
                        <View style={{ width: 56 }}>
                          <Text latin variant="label" weight="bold" tabular>
                            {s.startTime}
                          </Text>
                          <Text latin variant="caption" color="textFaint" tabular>
                            {s.endTime}
                          </Text>
                        </View>
                      }
                      title={s.subject}
                      subtitle={s.teacherName}
                    />
                  ))}
                </ListGroup>
              ) : (
                <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="coffee" size={18} color="accent" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label" weight="semibold">
                      {t("portal.noClassTitle")}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {data.nextClass
                        ? t("portal.nextClassOn", {
                            day: dayName(data.nextClass.day),
                            time: `${data.nextClass.startTime}–${data.nextClass.endTime}`,
                          })
                        : t("portal.noScheduleYet")}
                    </Text>
                  </View>
                </Card>
              )}
              {data.batch ? (
                <Text variant="caption" color="textFaint">
                  {t("portal.batchLabel", { batch: data.courseName ? `${data.courseName} · ${data.batch.name}` : data.batch.name, teacher: data.batch.teacherName })}
                </Text>
              ) : null}
            </Section>
          </Reveal>

          {/* Fees */}
          <Reveal index={1}>
            <Section title={t("portal.thisMonthsFee")}>
              {data.fees.outstanding === 0 ? (
                <Card tone="muted" onPress={() => router.push("/s/fees")} style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={20} color="success" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="semibold" color="success">
                      {t("student.allPaid")}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {t("portal.allPaidBody")}
                    </Text>
                  </View>
                </Card>
              ) : (
                <Card onPress={() => router.push("/s/fees")} style={{ gap: space.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md }}>
                    <View style={{ gap: space.xs, flex: 1 }}>
                      <Text variant="caption" color="textMuted">
                        {t("portal.outstanding")}
                      </Text>
                      <Text latin variant="figure" tabular>
                        {money(data.fees.outstanding)}
                      </Text>
                    </View>
                    {data.fees.next ? <Badge label={t(`status.${data.fees.next.status}` as never)} tone={FEE_TONE[data.fees.next.status] ?? "neutral"} /> : null}
                  </View>
                  {data.fees.next ? (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
                      <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                        {t("portal.nextDue", { month: monthLabel(data.fees.next.month), date: dateLabel(data.fees.next.dueDate) })}
                      </Text>
                      <Text latin variant="label" weight="semibold" tabular>
                        {money(data.fees.next.balance)}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              )}
            </Section>
          </Reveal>

          {/* Attendance + result */}
          <Reveal index={2}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, marginBottom: space.xl }}>
              <Card onPress={() => router.push("/s/attendance")} style={{ flex: 1, minWidth: 150, gap: space.md }}>
                <Text variant="caption" color="textMuted">
                  {t("student.attendance")}
                </Text>
                {rate === null ? (
                  <Text variant="caption" color="textFaint">
                    {t("portal.noAttendanceYet")}
                  </Text>
                ) : (
                  <>
                    <Text latin variant="figure" tabular>
                      {rate}%
                    </Text>
                    <Progress value={rate / 100} tone={rateTone} />
                  </>
                )}
              </Card>
              <Card onPress={() => router.push("/s/results")} style={{ flex: 1, minWidth: 150, gap: space.sm }}>
                <Text variant="caption" color="textMuted">
                  {t("student.latestResult")}
                </Text>
                {data.latestResult ? (
                  <>
                    <Text latin variant="figure" tabular>
                      {Math.round((data.latestResult.marks / data.latestResult.totalMarks) * 100)}%
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {data.latestResult.title}
                    </Text>
                    <Text latin variant="caption" color="textFaint" tabular>
                      {t("portal.marksOf", { marks: data.latestResult.marks, total: data.latestResult.totalMarks })}
                    </Text>
                  </>
                ) : (
                  <Text variant="caption" color="textFaint">
                    {t("portal.noResultsYet")}
                  </Text>
                )}
              </Card>
            </View>
          </Reveal>

          {/* Notices */}
          <Reveal index={3}>
            <Section
              title={t("portal.latestNotices")}
              action={
                data.notices.length > 0 ? (
                  <Pressable accessibilityRole="link" onPress={() => router.push("/s/notices")}>
                    <Text variant="label" weight="semibold" color="accent">
                      {t("common.seeAll")}
                    </Text>
                  </Pressable>
                ) : undefined
              }
            >
              {data.notices.length === 0 ? (
                <Card>
                  <Text color="textMuted">{t("portal.noNotices")}</Text>
                </Card>
              ) : (
                <ListGroup>
                  {data.notices.map((n) => (
                    <ListRow key={n._id} leading={<Icon name="bell" size={18} color="accent" />} title={n.title} subtitle={n.body} onPress={() => router.push("/s/notices")} />
                  ))}
                </ListGroup>
              )}
            </Section>
          </Reveal>
        </>
      )}
      {data === null ? <EmptyState icon="alert-circle" title={t("portal.loadError")} /> : null}
    </Screen>
  );
}
