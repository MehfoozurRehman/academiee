import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge, Card, EmptyState, Reveal, Screen, Skeleton, Text } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { space } from "../../theme/tokens";

function when(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StudentNotices() {
  const { t, dateLabel } = useI18n();
  const notices = useQuery(api.portal.notices);

  return (
    <Screen title={t("portal.noticesTitle")} subtitle={t("portal.noticesSubtitle")} narrow>
      {notices === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={100} />
          <Skeleton height={100} />
        </View>
      ) : notices.length === 0 ? (
        <EmptyState icon="bell" title={t("portal.noNotices")} body={t("portal.noNoticesBody")} />
      ) : (
        <View style={{ gap: space.md }}>
          {notices.map((n, i) => (
            <Reveal key={n._id} index={Math.min(i, 6)}>
              <Card style={{ gap: space.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
                  <Text variant="caption" color="textMuted">
                    {dateLabel(when(n.createdAt))}
                  </Text>
                  {n.forBatch ? <Badge label={t("portal.forYourBatch")} tone="accent" /> : null}
                </View>
                <Text weight="semibold">{n.title}</Text>
                <Text color="textMuted">{n.body}</Text>
              </Card>
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
