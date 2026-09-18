import { View } from "react-native";
import { Redirect, router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSession } from "../../context/session";
import {
  currentMonthKey,
  formatMoney,
  monthLabel,
  useTheme,
} from "../../theme";
import {
  AppBar,
  AppText,
  Badge,
  Card,
  Loader,
  Screen,
} from "../../components/ui";
import { Icon, type IconName } from "../../components/Icon";

function Tile({
  label,
  value,
  tone,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  tone: string;
  icon: IconName;
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <Card style={{ flex: 1, minWidth: "45%" }} onPress={onPress}>
      <View style={{ gap: t.spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: t.radius.sm,
            backgroundColor: tone,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={18} color={t.colors.text} />
        </View>
        <AppText variant="caption" color={t.colors.textMuted}>
          {label}
        </AppText>
        <AppText variant="title" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </Card>
  );
}

export default function Dashboard() {
  const t = useTheme();
  const { session } = useSession();
  const month = currentMonthKey();

  const academy = useQuery(
    api.academies.getAcademy,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const stats = useQuery(
    api.academies.getDashboard,
    session?.academyId ? { academyId: session.academyId, month } : "skip"
  );

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;
  if (stats === undefined || academy === undefined) return <Loader />;

  const currency = academy?.currency ?? "PKR";
  const needsAttention = stats.feesOverdue + stats.feesDue + stats.feesPartial;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title={academy?.name ?? "Dashboard"}
        subtitle={monthLabel(month)}
        large
      />

      <Screen scroll>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}>
          <Tile
            label="Students"
            value={String(stats.activeStudents)}
            tone={t.colors.accentSoft}
            icon="students"
            onPress={() => router.push("/students")}
          />
          <Tile
            label="Collected"
            value={formatMoney(stats.collected, currency)}
            tone={t.colors.successSoft}
            icon="fees"
            onPress={() => router.push("/fees")}
          />
          <Tile
            label="Outstanding"
            value={formatMoney(stats.outstanding, currency)}
            tone={t.colors.warningSoft}
            icon="expenses"
            onPress={() => router.push("/fees")}
          />
          <Tile
            label="Attendance"
            value={`${stats.attendanceRate}%`}
            tone={t.colors.infoSoft}
            icon="attendance"
            onPress={() => router.push("/attendance")}
          />
        </View>

        <Card>
          <View style={{ gap: t.spacing.md }}>
            <AppText variant="heading">This month</AppText>

            <View style={{ gap: t.spacing.sm }}>
              {[
                { label: "Expenses", value: formatMoney(stats.expenses, currency), color: t.colors.text },
                {
                  label: "Net",
                  value: formatMoney(stats.net, currency),
                  color: stats.net >= 0 ? t.colors.success : t.colors.danger,
                },
                { label: "Active batches", value: String(stats.activeBatches), color: t.colors.text },
                { label: "Teachers", value: String(stats.totalTeachers), color: t.colors.text },
              ].map((r) => (
                <View
                  key={r.label}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                >
                  <AppText variant="body" color={t.colors.textMuted}>
                    {r.label}
                  </AppText>
                  <AppText variant="body" color={r.color} style={{ fontWeight: "600" } as never}>
                    {r.value}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <Card onPress={() => router.push("/fees")}>
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="heading">Fees needing action</AppText>
              <AppText variant="title" color={needsAttention > 0 ? t.colors.warning : t.colors.success}>
                {needsAttention}
              </AppText>
            </View>

            <View style={{ flexDirection: "row", gap: t.spacing.sm, flexWrap: "wrap" }}>
              <Badge label={`${stats.feesOverdue} overdue`} tone={stats.feesOverdue ? "danger" : "neutral"} />
              <Badge label={`${stats.feesPartial} partial`} tone={stats.feesPartial ? "warning" : "neutral"} />
              <Badge label={`${stats.feesDue} due`} tone={stats.feesDue ? "info" : "neutral"} />
              <Badge label={`${stats.feesPaid} paid`} tone="success" />
            </View>
          </View>
        </Card>
      </Screen>
    </View>
  );
}
