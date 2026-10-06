import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge, Card, EmptyState, Icon, Input, ListGroup, ListRow, Pressable, Reveal, Screen, Section, Skeleton, Text, type IconName } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, space } from "../../theme/tokens";

function dayOf(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Stat({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <Card style={{ flex: 1, minWidth: 140, gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Icon name={icon} size={16} color="textMuted" />
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text latin variant="heading" weight="bold" tabular>
        {value.toLocaleString("en-US")}
      </Text>
    </Card>
  );
}

function open(id: Id<"academies">) {
  router.push(`/admin/academies/${id}` as never);
}

export default function AdminOverview() {
  const { t, dateLabel } = useI18n();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;
  const [search, setSearch] = useState("");
  const overview = useQuery(api.admin.overview);
  const academies = useQuery(api.admin.academies, { search });

  const cols = [
    { key: "name", flex: 2.2 },
    { key: "code", flex: 1 },
    { key: "city", flex: 1 },
    { key: "owner", flex: 2 },
    { key: "students", flex: 0.8 },
    { key: "created", flex: 1.2 },
    { key: "status", flex: 1 },
  ];

  const headers: Record<string, string> = {
    name: t("settingsUi.academyName"),
    code: t("admin.code"),
    city: t("admin.city"),
    owner: t("admin.owner"),
    students: t("admin.statStudents"),
    created: t("admin.created"),
    status: t("admin.status"),
  };

  return (
    <Screen title={t("admin.overview")} subtitle={t("admin.title")}>
      <Reveal index={0}>
        <Section>
          {overview === undefined ? (
            <Skeleton height={90} />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
              <Stat icon="layers" label={t("admin.statAcademies")} value={overview.academies} />
              <Stat icon="check-circle" label={t("admin.statActive")} value={overview.active} />
              <Stat icon="slash" label={t("admin.statSuspended")} value={overview.suspended} />
              <Stat icon="users" label={t("admin.statStudents")} value={overview.students} />
              <Stat icon="user" label={t("admin.statOwners")} value={overview.owners} />
            </View>
          )}
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section title={t("admin.recent")}>
          {overview === undefined ? (
            <Skeleton height={160} />
          ) : overview.recent.length === 0 ? (
            <Card>
              <Text color="textMuted">{t("admin.noAcademies")}</Text>
            </Card>
          ) : (
            <ListGroup>
              {overview.recent.map((a) => (
                <ListRow
                  key={a._id}
                  title={a.name}
                  subtitle={`${a.code}${a.city ? ` · ${a.city}` : ""} · ${a.ownerEmail ?? t("admin.unknownOwner")}`}
                  trailing={
                    <Text variant="caption" color="textFaint">
                      {dateLabel(dayOf(a.created))}
                    </Text>
                  }
                  onPress={() => open(a._id)}
                />
              ))}
            </ListGroup>
          )}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title={t("admin.allAcademies")}>
          <Input icon="search" value={search} onChangeText={setSearch} placeholder={t("admin.searchPlaceholder")} autoCapitalize="none" autoCorrect={false} />
          {academies === undefined ? (
            <View style={{ gap: space.sm }}>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </View>
          ) : academies.length === 0 ? (
            <EmptyState icon="search" title={t("admin.noAcademies")} body={t("admin.noAcademiesBody")} />
          ) : wide ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: colors.surfaceMuted }}>
                {cols.map((c) => (
                  <Text key={c.key} variant="micro" color="textMuted" style={{ flex: c.flex }} numberOfLines={1}>
                    {headers[c.key]}
                  </Text>
                ))}
              </View>
              {academies.map((a) => (
                <Pressable
                  key={a._id}
                  accessibilityRole="button"
                  onPress={() => open(a._id)}
                  scaleTo={0.995}
                  style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderColor: colors.border }}
                >
                  <Text variant="label" weight="semibold" style={{ flex: cols[0].flex }} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text latin variant="caption" style={{ flex: cols[1].flex }} numberOfLines={1}>
                    {a.code}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ flex: cols[2].flex }} numberOfLines={1}>
                    {a.city ?? "—"}
                  </Text>
                  <Text latin variant="caption" color="textMuted" style={{ flex: cols[3].flex }} numberOfLines={1}>
                    {a.ownerEmail ?? "—"}
                  </Text>
                  <Text latin variant="caption" tabular style={{ flex: cols[4].flex }}>
                    {a.studentCount}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ flex: cols[5].flex }} numberOfLines={1}>
                    {dateLabel(dayOf(a.created))}
                  </Text>
                  <View style={{ flex: cols[6].flex }}>
                    <Badge label={a.suspended ? t("admin.suspended") : t("admin.active")} tone={a.suspended ? "danger" : "success"} />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <ListGroup>
              {academies.map((a) => (
                <ListRow
                  key={a._id}
                  title={a.name}
                  subtitle={`${a.code}${a.city ? ` · ${a.city}` : ""} · ${t("admin.studentsCount", { count: a.studentCount })}`}
                  trailing={<Badge label={a.suspended ? t("admin.suspended") : t("admin.active")} tone={a.suspended ? "danger" : "success"} />}
                  onPress={() => open(a._id)}
                />
              ))}
            </ListGroup>
          )}
        </Section>
      </Reveal>
    </Screen>
  );
}
