import { Alert, FlatList, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import {
  AppBar,
  AppText,
  Card,
  EmptyState,
  Loader,
  Row,
} from "../components/ui";
import { cleanError } from "../lib/errors";

const LABEL: Record<string, string> = {
  students: "Student",
  teachers: "Teacher",
  batches: "Batch",
  courses: "Course",
  fees: "Fee",
  attendance: "Attendance",
  expenses: "Expense",
  tests: "Test",
  timetable: "Timetable",
  salaries: "Salary",
};

export default function RecycleBin() {
  const t = useTheme();
  const { session } = useSession();
  const restore = useMutation(api.recycleBin.restore);
  const purge = useMutation(api.recycleBin.purge);

  const items = useQuery(
    api.recycleBin.listDeleted,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  if (items === undefined) return <Loader />;

  function act(table: string, id: string, label: string) {
    Alert.alert(label, "Restore this item, or delete it permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: async () => {
          try {
            await restore({ table: table as never, id });
          } catch (e) {
            Alert.alert("Could not restore", cleanError(e, "Unknown error"));
          }
        },
      },
      {
        text: "Delete forever",
        style: "destructive",
        onPress: async () => {
          try {
            await purge({ table: table as never, id });
          } catch (e) {
            Alert.alert("Could not delete", cleanError(e, "Unknown error"));
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title="Recycle Bin"
        subtitle={`${items.length} item(s)`}
        onBack={() => router.back()}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Recycle bin is empty"
          message="Anything you delete lands here first, so nothing is lost by accident."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => `${i.table}:${i.id}`}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <AppText
              variant="caption"
              color={t.colors.textMuted}
              style={{ marginBottom: t.spacing.md } as never}
            >
              Tap an item to restore it or delete it permanently.
            </AppText>
          }
          renderItem={({ item }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.label}
                subtitle={item.detail}
                badge={LABEL[item.table] ?? item.table}
                badgeTone="neutral"
                onPress={() => act(item.table, item.id, item.label)}
              />
            </Card>
          )}
        />
      )}
    </View>
  );
}
