import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge, Card, EmptyState, ListGroup, ListRow, Progress, Reveal, Screen, Section, Skeleton, Text, type Tone } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { space } from "../../theme/tokens";

const TONE: Record<string, Tone> = { present: "success", late: "warning", absent: "danger" };

function Count({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  return (
    <Card style={{ flex: 1, minWidth: 90, gap: space.xs }}>
      <Text variant="caption" color={tone}>
        {label}
      </Text>
      <Text latin variant="heading" weight="bold" tabular>
        {value}
      </Text>
    </Card>
  );
}

export default function StudentAttendance() {
  const { t, monthLabel, dateLabel, dayName } = useI18n();
  const data = useQuery(api.portal.attendance);

  // Records arrive newest first; group by YYYY-MM keeping that order.
  const groups: { month: string; rows: { date: string; status: string }[] }[] = [];
  for (const r of data?.records ?? []) {
    const month = r.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.rows.push(r);
    else groups.push({ month, rows: [{ ...r }] });
  }

  const rate = data?.rate ?? null;
  const rateTone: Tone = rate === null ? "accent" : rate >= 85 ? "success" : rate >= 70 ? "warning" : "danger";

  return (
    <Screen title={t("nav.attendance")} subtitle={t("portal.attendanceSubtitle")} narrow>
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={120} />
          <Skeleton height={70} />
          <Skeleton height={200} />
        </View>
      ) : data.records.length === 0 ? (
        <EmptyState icon="check-square" title={t("portal.noRecords")} body={t("portal.noRecordsBody")} />
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Card style={{ gap: space.md }}>
                <Text variant="caption" color="textMuted">
                  {t("portal.rate")}
                </Text>
                <Text latin variant="display" tabular>
                  {rate}%
                </Text>
                <Progress value={(rate ?? 0) / 100} tone={rateTone} />
                <Text variant="caption" color="textFaint">
                  {t("portal.attendanceHint")}
                </Text>
              </Card>
            </Section>
          </Reveal>
          <Reveal index={1}>
            <Section>
              <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
                <Count label={t("portal.present")} value={data.counts.present} tone="success" />
                <Count label={t("portal.late")} value={data.counts.late} tone="warning" />
                <Count label={t("portal.absent")} value={data.counts.absent} tone="danger" />
              </View>
            </Section>
          </Reveal>
          {groups.map((g, gi) => (
            <Reveal key={g.month} index={Math.min(gi + 2, 6)}>
              <Section title={monthLabel(g.month)}>
                <ListGroup>
                  {g.rows.map((r) => {
                    const [y, m, d] = r.date.split("-").map(Number);
                    return (
                      <ListRow
                        key={r.date}
                        title={dateLabel(r.date)}
                        subtitle={dayName(new Date(y, m - 1, d).getDay())}
                        trailing={<Badge label={t(`status.${r.status}` as never)} tone={TONE[r.status] ?? "neutral"} />}
                      />
                    );
                  })}
                </ListGroup>
              </Section>
            </Reveal>
          ))}
        </>
      )}
    </Screen>
  );
}
