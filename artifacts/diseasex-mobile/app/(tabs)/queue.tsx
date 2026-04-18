import { Feather } from "@expo/vector-icons";
import { useGetPatientQueue } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type UrgencyFilter = "all" | "critical" | "monitor" | "low";

function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors = useColors();
  const config = {
    critical: { bg: colors.criticalBg, text: colors.critical, label: "CRITICAL" },
    monitor: { bg: colors.monitorBg, text: colors.monitor, label: "MONITOR" },
    low: { bg: colors.lowBg, text: colors.low, label: "LOW RISK" },
  }[urgency] ?? { bg: colors.muted, text: colors.mutedForeground, label: urgency.toUpperCase() };

  return (
    <View style={{ backgroundColor: config.bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 10, color: config.text, letterSpacing: 0.5 }}>
        {config.label}
      </Text>
    </View>
  );
}

export default function QueueScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<UrgencyFilter>("all");

  const { data: queue, isLoading, refetch } = useGetPatientQueue();

  const filtered = (queue ?? []).filter((e) => filter === "all" || e.urgency === filter);

  const filters: { key: UrgencyFilter; label: string; color: string }[] = [
    { key: "all", label: "All", color: colors.primary },
    { key: "critical", label: "Critical", color: colors.critical },
    { key: "monitor", label: "Monitor", color: colors.monitor },
    { key: "low", label: "Low Risk", color: colors.low },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        backgroundColor: colors.secondary,
        paddingTop: topPad + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" }}>Patient Queue</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
          {queue?.length ?? 0} active patients
        </Text>
      </View>

      <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: filter === f.key ? f.color : colors.muted,
            }}
          >
            <Text style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
              color: filter === f.key ? "#fff" : colors.mutedForeground,
            }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => String(e.patient.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 80, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
              <Feather name="check-circle" size={40} color={colors.low} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12, textAlign: "center" }}>
                No {filter === "all" ? "" : filter} patients in queue
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/patient/${item.patient.id}`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: pressed ? colors.muted : colors.card,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              })}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: item.urgency === "critical" ? colors.criticalBg : item.urgency === "monitor" ? colors.monitorBg : colors.lowBg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}>
                <Feather
                  name={item.urgency === "critical" ? "alert-circle" : item.urgency === "monitor" ? "clock" : "check"}
                  size={20}
                  color={item.urgency === "critical" ? colors.critical : item.urgency === "monitor" ? colors.monitor : colors.low}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground }}>{item.patient.name}</Text>
                  <UrgencyBadge urgency={item.urgency} />
                </View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground }}>
                  {item.patient.ageYears ? `${item.patient.ageYears}y` : item.patient.ageMonths ? `${item.patient.ageMonths}m` : "?"}
                  {" • "}{item.patient.location}
                  {item.topMatch ? ` • ${item.topMatch.disease} (${item.topMatch.confidencePercent}%)` : ""}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
