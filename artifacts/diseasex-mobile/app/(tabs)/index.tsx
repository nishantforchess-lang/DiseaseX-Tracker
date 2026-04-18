import { Feather } from "@expo/vector-icons";
import { useGetDashboardSummary, useGetPatientQueue, useListOutbreakAlerts } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors = useColors();
  const config = {
    critical: { bg: colors.criticalBg, text: colors.critical, label: "CRITICAL" },
    monitor: { bg: colors.monitorBg, text: colors.monitor, label: "MONITOR" },
    low: { bg: colors.lowBg, text: colors.low, label: "LOW RISK" },
  }[urgency] ?? { bg: colors.muted, text: colors.mutedForeground, label: urgency.toUpperCase() };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: summary, isLoading: sumLoading, refetch: refetchSum } = useGetDashboardSummary();
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useGetPatientQueue();
  const { data: outbreaks, refetch: refetchOutbreaks } = useListOutbreakAlerts();

  const isLoading = sumLoading || queueLoading;
  const activeOutbreaks = outbreaks?.filter((o) => o.status === "active") ?? [];
  const criticalQueue = queue?.filter((e) => e.urgency === "critical" || e.urgency === "monitor") ?? [];

  const onRefresh = () => {
    refetchSum();
    refetchQueue();
    refetchOutbreaks();
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.secondary,
      paddingTop: topPad + 12,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    appName: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF" },
    appSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 2 },
    newBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
    },
    newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
    alertBanner: {
      margin: 16,
      backgroundColor: colors.criticalBg,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: colors.critical,
      padding: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    alertText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.critical, flex: 1 },
    alertSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.critical, marginTop: 2, flex: 1 },
    statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, flexWrap: "wrap" },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    statNum: { fontFamily: "Inter_700Bold", fontSize: 28, marginTop: 4 },
    statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
    },
    sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground },
    seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.primary },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowContent: { flex: 1 },
    rowName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    rowSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    emptyBox: { padding: 24, alignItems: "center" },
    emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (isLoading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.appName}>DiseaseX</Text>
            <Text style={s.appSub}>Triage & Protocol Engine</Text>
          </View>
          <Pressable style={s.newBtn} onPress={() => router.push("/(tabs)/intake")}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={s.newBtnText}>Assess</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      >
        {activeOutbreaks.length > 0 && (
          <Pressable style={s.alertBanner} onPress={() => router.push("/(tabs)/outbreaks")}>
            <Feather name="alert-triangle" size={18} color={colors.critical} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertText}>ACTIVE OUTBREAK ALERTS ({activeOutbreaks.length})</Text>
              <Text style={s.alertSub}>{activeOutbreaks[0].location}: {activeOutbreaks[0].symptomsSummary}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.critical} />
          </Pressable>
        )}

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Feather name="users" size={18} color={colors.mutedForeground} />
            <Text style={[s.statNum, { color: colors.foreground }]}>{summary?.activeCases ?? 0}</Text>
            <Text style={s.statLabel}>Active Cases</Text>
          </View>
          <View style={[s.statCard, { borderColor: colors.critical + "44" }]}>
            <Feather name="activity" size={18} color={colors.critical} />
            <Text style={[s.statNum, { color: colors.critical }]}>{summary?.criticalCases ?? 0}</Text>
            <Text style={s.statLabel}>Critical Cases</Text>
          </View>
          <View style={s.statCard}>
            <Feather name="clipboard" size={18} color={colors.mutedForeground} />
            <Text style={[s.statNum, { color: colors.foreground }]}>{summary?.assessmentsToday ?? 0}</Text>
            <Text style={s.statLabel}>Assessments Today</Text>
          </View>
          <View style={s.statCard}>
            <Feather name="alert-circle" size={18} color={colors.monitor} />
            <Text style={[s.statNum, { color: colors.monitor }]}>{summary?.atypicalCasesThisWeek ?? 0}</Text>
            <Text style={s.statLabel}>Atypical This Week</Text>
          </View>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Critical & Monitor Queue</Text>
          <Pressable onPress={() => router.push("/(tabs)/queue")}>
            <Text style={s.seeAll}>View All</Text>
          </Pressable>
        </View>

        {criticalQueue.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="check-circle" size={32} color={colors.low} />
            <Text style={s.emptyText}>No critical patients at this time</Text>
          </View>
        ) : (
          criticalQueue.slice(0, 5).map((entry) => (
            <Pressable
              key={entry.patient.id}
              style={s.row}
              onPress={() => router.push(`/patient/${entry.patient.id}`)}
            >
              <View style={s.rowContent}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={s.rowName}>{entry.patient.name}</Text>
                  <UrgencyBadge urgency={entry.urgency} />
                </View>
                <Text style={s.rowSub}>
                  {entry.patient.ageYears ? `${entry.patient.ageYears}y` : entry.patient.ageMonths ? `${entry.patient.ageMonths}m` : "?"}
                  {" • "}{entry.patient.location}
                  {entry.topMatch ? ` • ${entry.topMatch.disease}` : ""}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
});
