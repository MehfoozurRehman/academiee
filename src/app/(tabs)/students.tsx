import { useState } from "react";
import { FlatList, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSession } from "../../context/session";
import { formatMoney, useTheme } from "../../theme";
import {
  AppBar,
  Avatar,
  Card,
  EmptyState,
  Fab,
  Field,
  Loader,
  Row,
  Segmented,
} from "../../components/ui";

export default function Students() {
  const t = useTheme();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");

  const students = useQuery(
    api.students.listStudents,
    session?.academyId
      ? {
          academyId: session.academyId,
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
        }
      : "skip"
  );

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title="Students"
        subtitle={students ? `${students.length} shown` : undefined}
        large
      />

      <View style={{ paddingHorizontal: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.md }}>
        <Field value={search} onChangeText={setSearch} placeholder="Search name, father or phone" />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Graduated", value: "graduated" },
            { label: "All", value: "all" },
          ]}
        />
      </View>

      {students === undefined ? (
        <Loader />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          message={
            search
              ? "Nothing matched your search. Try a different name or phone number."
              : "Add your first student to start tracking fees and attendance."
          }
          actionLabel="Add student"
          onAction={() => router.push("/student/new")}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.studentId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.name}
                subtitle={`${item.batchName} · ${item.parentPhone}`}
                meta={
                  item.outstanding > 0
                    ? formatMoney(item.outstanding, "PKR")
                    : formatMoney(item.monthlyFee, "PKR")
                }
                metaTone={item.outstanding > 0 ? t.colors.danger : t.colors.textMuted}
                badge={item.status !== "active" ? item.status : undefined}
                badgeTone={item.status === "inactive" ? "neutral" : "info"}
                leading={<Avatar name={item.name} />}
                onPress={() => router.push(`/student/${item.studentId}`)}
              />
            </Card>
          )}
        />
      )}

      <Fab onPress={() => router.push("/student/new")} />
    </View>
  );
}
