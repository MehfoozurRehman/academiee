import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, EmptyState, Icon, Reveal, Screen, Skeleton, Text } from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";

const VOIDS = new Set(["payment.voided", "invoice.voided", "expense.voided"]);

function dayOf(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function clock(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Activity() {
  const { t, dateLabel } = useI18n();
  const { colors } = useTheme();
  const academyId = useAcademyId();
  const rows = useQuery(api.academies.auditLog, { academyId });

  function label(code: string) {
    const key = `activity.${code.replace(".", "_")}`;
    const text = t(key as never);
    return text === key ? code : text;
  }

  return (
    <Screen title={t("activity.title")} subtitle={t("activity.subtitle")} narrow>
      {rows === undefined ? (
        <View style={{ gap: space.sm }}>
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState icon="activity" title={t("activity.empty")} body={t("activity.emptyBody")} />
      ) : (
        <View style={{ gap: space.sm }}>
          {rows.map((r, i) => {
            const danger = VOIDS.has(r.action);
            return (
              <Reveal key={r._id} index={Math.min(i, 6)}>
                <Card style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: danger ? colors.dangerSoft : colors.accentSoft,
                    }}
                  >
                    <Icon name={danger ? "slash" : "activity"} size={16} color={danger ? "danger" : "accent"} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label" weight="semibold" color={danger ? "danger" : "text"}>
                      {label(r.action)}
                    </Text>
                    {r.detail ? (
                      <Text variant="caption" color="textMuted">
                        {r.detail}
                      </Text>
                    ) : null}
                    <Text variant="caption" color="textFaint">
                      {t("activity.by", { name: r.userName })} · {dateLabel(dayOf(r._creationTime))}{" "}
                      <Text latin variant="caption" color="textFaint">
                        {clock(r._creationTime)}
                      </Text>
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
