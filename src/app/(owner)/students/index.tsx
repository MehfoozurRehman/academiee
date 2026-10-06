import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  Button,
  Chips,
  EmptyState,
  Input,
  ListGroup,
  ListRow,
  Reveal,
  Screen,
  Select,
  Skeleton,
  Text,
} from "../../../components/ui";
import { useAcademyId } from "../../../context/AcademyContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { space } from "../../../theme/tokens";

type Status = "active" | "left" | "graduated";
const ALL = "all";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function Students() {
  const { t, money } = useI18n();
  const academyId = useAcademyId();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 250);
  const [status, setStatus] = useState<Status>("active");
  const [batch, setBatch] = useState<string>(ALL);

  const batches = useQuery(api.classes.listBatches, { academyId });
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.students.list,
    {
      academyId,
      status,
      batchId: batch === ALL ? undefined : (batch as Id<"batches">),
      search: search || undefined,
    },
    { initialNumItems: 30 }
  );

  const batchOptions = useMemo(
    () => [
      { value: ALL, label: t("students.allBatches") },
      ...(batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: b.courseName })),
    ],
    [batches, t]
  );

  const loading = pageStatus === "LoadingFirstPage";
  const filtered = search !== "" || batch !== ALL || status !== "active";
  const statusLabel = t(`students.${status}` as never);

  return (
    <Screen
      title={t("students.title")}
      action={<Button size="sm" icon="user-plus" label={t("students.add")} onPress={() => router.push("/students/new")} />}
    >
      <Reveal index={0}>
        <View style={{ gap: space.md, marginBottom: space.lg }}>
          <Input
            icon="search"
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("students.searchPlaceholder")}
            returnKeyType="search"
            autoCorrect={false}
          />
          <Chips
            value={status}
            onChange={setStatus}
            options={[
              { value: "active", label: t("students.active") },
              { value: "left", label: t("students.left") },
              { value: "graduated", label: t("students.graduated") },
            ]}
          />
          {batches && batches.length > 0 ? (
            <Select value={batch} options={batchOptions} onChange={setBatch} label={t("students.batchFilter")} />
          ) : null}
        </View>
      </Reveal>

      {loading ? (
        <View style={{ gap: space.sm }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={64} />
          ))}
        </View>
      ) : results.length === 0 ? (
        filtered ? (
          <EmptyState
            icon="search"
            title={search || batch !== ALL ? t("students.noMatch") : t("students.noneInStatus", { status: statusLabel.toLowerCase() })}
            body={t("students.noMatchBody")}
          />
        ) : (
          <EmptyState
            icon="users"
            title={t("students.empty")}
            body={t("students.emptyBody")}
            action={<Button icon="user-plus" label={t("students.add")} onPress={() => router.push("/students/new")} />}
          />
        )
      ) : (
        <View style={{ gap: space.lg }}>
          <ListGroup>
            {results.map((s) => (
              <ListRow
                key={s._id}
                leading={<Avatar name={s.name} size={40} />}
                title={s.name}
                subtitle={`${s.code} · ${s.batchName}`}
                trailing={
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text latin variant="label" weight="semibold" tabular>
                      {money(s.monthlyFee)}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {s.fatherName}
                    </Text>
                  </View>
                }
                onPress={() => router.push(`/students/${s._id}` as never)}
              />
            ))}
          </ListGroup>
          {pageStatus === "CanLoadMore" || pageStatus === "LoadingMore" ? (
            <View style={{ alignItems: "center" }}>
              <Button
                variant="secondary"
                label={t("students.loadMore")}
                loading={pageStatus === "LoadingMore"}
                onPress={() => loadMore(30)}
              />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
