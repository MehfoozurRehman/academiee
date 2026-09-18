import { Host, Column, Text, Button } from "@expo/ui";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Index() {
  const health = useQuery(api.health.status);

  return (
    <Host style={{ width: "100%", height: "100%" }}>
      <Column spacing={16} alignment="center" style={{ padding: 24 }}>
        <Text textStyle={{ fontSize: 28, fontWeight: "700" }}>Academy OS</Text>

        <Text textStyle={{ fontSize: 16, color: health ? "#16a34a" : "#a1a1aa" }}>
          {health ? "Connected to Convex" : "Connecting..."}
        </Text>

        <Text textStyle={{ fontSize: 15 }}>
          {health
            ? `${health.academyCount} academies · ${health.userCount} users`
            : " "}
        </Text>

        <Button variant="filled" onPress={() => {}} label="Add academy" />
      </Column>
    </Host>
  );
}
