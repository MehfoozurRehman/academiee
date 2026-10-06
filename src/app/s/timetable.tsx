import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, EmptyState, ListGroup, ListRow, Reveal, Screen, Section, Skeleton, Text } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { useToday } from "../../lib/useToday";
import { space } from "../../theme/tokens";

function TimeCol({ start, end }: { start: string; end: string }) {
  return (
    <View style={{ width: 56 }}>
      <Text latin variant="label" weight="bold" tabular>
        {start}
      </Text>
      <Text latin variant="caption" color="textFaint" tabular>
        {end}
      </Text>
    </View>
  );
}

export default function StudentTimetable() {
  const { t, dayName } = useI18n();
  const { today } = useToday();
  const data = useQuery(api.portal.timetable);
  const [y, m, d] = today.split("-").map(Number);
  const todayDay = new Date(y, m - 1, d).getDay();

  // Monday-first week order.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const byDay = new Map<number, NonNullable<typeof data>["slots"]>();
  for (const s of data?.slots ?? []) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s]);

  return (
    <Screen title={t("portal.timetableTitle")} subtitle={t("portal.timetableSubtitle")} narrow>
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={100} />
          <Skeleton height={100} />
        </View>
      ) : data.slots.length > 0 ? (
        order
          .filter((day) => byDay.has(day))
          .map((day, i) => (
            <Reveal key={day} index={Math.min(i, 6)}>
              <Section
                title={dayName(day)}
                action={
                  day === todayDay ? (
                    <Text variant="caption" weight="semibold" color="accent">
                      {t("common.today")}
                    </Text>
                  ) : undefined
                }
              >
                <ListGroup>
                  {(byDay.get(day) ?? []).map((s) => (
                    <ListRow key={s._id} leading={<TimeCol start={s.startTime} end={s.endTime} />} title={s.subject} subtitle={s.teacherName} />
                  ))}
                </ListGroup>
              </Section>
            </Reveal>
          ))
      ) : data.fallback && data.fallback.days.length > 0 ? (
        <Reveal index={0}>
          <Section title={t("portal.batchSchedule")}>
            <ListGroup>
              {order
                .filter((day) => data.fallback?.days.includes(day))
                .map((day) => (
                  <ListRow
                    key={day}
                    leading={<TimeCol start={data.fallback!.startTime} end={data.fallback!.endTime} />}
                    title={dayName(day)}
                    subtitle={data.fallback!.teacherName}
                  />
                ))}
            </ListGroup>
          </Section>
        </Reveal>
      ) : (
        <EmptyState icon="calendar" title={t("portal.noTimetable")} body={t("portal.noTimetableBody")} />
      )}
      {data === null ? <Card><Text color="textMuted">{t("portal.loadError")}</Text></Card> : null}
    </Screen>
  );
}
