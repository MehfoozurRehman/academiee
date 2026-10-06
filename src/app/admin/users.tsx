import { View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, Badge, EmptyState, ListGroup, ListRow, Reveal, Screen, Skeleton } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { space } from "../../theme/tokens";

function dayOf(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminUsers() {
  const { t, dateLabel } = useI18n();
  const users = useQuery(api.admin.users);

  return (
    <Screen title={t("admin.usersTitle")} subtitle={t("admin.usersSubtitle")} narrow>
      {users === undefined ? (
        <View style={{ gap: space.sm }}>
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : users.length === 0 ? (
        <EmptyState icon="users" title={t("admin.noUsers")} />
      ) : (
        <Reveal index={0}>
          <ListGroup>
            {users.map((u) => (
              <ListRow
                key={u._id}
                leading={<Avatar name={u.name ?? u.email ?? "?"} size={38} />}
                title={u.name ?? u.email ?? t("admin.noName")}
                subtitle={`${u.name ? `${u.email ?? ""} · ` : ""}${t("admin.joined", { date: dateLabel(dayOf(u.created)) })}`}
                trailing={
                  <View style={{ alignItems: "flex-end", gap: space.xs }}>
                    {u.isAdmin ? <Badge label={t("admin.adminBadge")} tone="accent" /> : null}
                    {u.academiesOwned > 0 ? (
                      <Badge label={u.academiesOwned === 1 ? t("admin.ownsOne") : t("admin.ownsAcademies", { count: u.academiesOwned })} tone="neutral" />
                    ) : null}
                    {u.isStudent ? <Badge label={t("admin.studentBadge")} tone="success" /> : null}
                  </View>
                }
                chevron={false}
              />
            ))}
          </ListGroup>
        </Reveal>
      )}
    </Screen>
  );
}
