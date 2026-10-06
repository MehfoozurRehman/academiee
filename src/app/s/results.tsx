import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, EmptyState, Progress, Reveal, Screen, Skeleton, Text, type Tone } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { space } from "../../theme/tokens";

export default function StudentResults() {
  const { t, dateLabel } = useI18n();
  const results = useQuery(api.portal.results);

  return (
    <Screen title={t("portal.resultsTitle")} subtitle={t("portal.resultsSubtitle")} narrow>
      {results === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={110} />
          <Skeleton height={110} />
        </View>
      ) : results.length === 0 ? (
        <EmptyState icon="award" title={t("portal.noResults")} body={t("portal.noResultsBody")} />
      ) : (
        <View style={{ gap: space.md }}>
          {results.map((r, i) => {
            const tone: Tone = r.percentage >= 75 ? "success" : r.percentage >= 50 ? "accent" : "warning";
            return (
              <Reveal key={r.testId} index={Math.min(i, 6)}>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text weight="semibold">{r.title}</Text>
                      <Text variant="caption" color="textMuted">
                        {r.subject ? `${r.subject} · ` : ""}
                        {dateLabel(r.date)}
                      </Text>
                    </View>
                    <Text latin variant="heading" weight="bold" tabular>
                      {r.percentage}%
                    </Text>
                  </View>
                  <Progress value={r.percentage / 100} tone={tone} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text latin variant="caption" color="textMuted" tabular>
                      {t("portal.marksOf", { marks: r.marks, total: r.totalMarks })}
                    </Text>
                    <Text latin variant="caption" weight="semibold" color="textMuted" tabular>
                      {t("portal.rank", { rank: r.rank, outOf: r.outOf })}
                    </Text>
                  </View>
                </Card>
              </Reveal>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
