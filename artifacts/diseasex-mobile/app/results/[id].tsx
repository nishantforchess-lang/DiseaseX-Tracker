import { Feather } from "@expo/vector-icons";
import { useGetAssessment, useGetPatient } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function ResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: assessment, isLoading } = useGetAssessment(Number(id));
  const { data: patient } = useGetPatient(assessment?.patientId ?? 0, {
    query: { enabled: !!assessment?.patientId },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.mutedForeground, marginTop: 12 }}>
          Running pattern analysis...
        </Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="alert-circle" size={40} color={colors.critical} />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12 }}>Assessment not found</Text>
      </View>
    );
  }

  const matches = [...(assessment.patternMatches ?? [])].sort((a, b) => b.confidencePercent - a.confidencePercent);
  const topMatch = matches[0];
  const isAtypical = assessment.isAtypical;

  const getConfColor = (pct: number) => {
    if (pct >= 70) return colors.critical;
    if (pct >= 40) return colors.monitor;
    return colors.low;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: bottomPad + 24 }}>
      {patient && (
        <View style={{ backgroundColor: colors.secondary, padding: 20 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" }}>{patient.name}</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94A3B8", marginTop: 2 }}>
            {patient.ageYears ? `${patient.ageYears}y` : patient.ageMonths ? `${patient.ageMonths}m` : "?"} • {patient.location}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {assessment.symptoms.map((s) => (
              <View key={s} style={{ backgroundColor: "#334155", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#CBD5E1" }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {isAtypical && (
        <View style={{
          margin: 16,
          backgroundColor: colors.criticalBg,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: colors.critical,
          padding: 16,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <Feather name="alert-triangle" size={20} color={colors.critical} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.critical }}>Atypical Presentation</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.critical, marginTop: 4 }}>
              This case does not match known patterns confidently. Consider reporting as a potential outbreak.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/outbreaks")}
              style={{ marginTop: 10, backgroundColor: colors.critical, borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
            >
              <Feather name="alert-triangle" size={14} color="#fff" />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>Report Outbreak</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground, marginBottom: 12 }}>Pattern Matches</Text>
        {matches.map((match, i) => {
          const confColor = getConfColor(match.confidencePercent);
          return (
            <View key={i} style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, flex: 1 }}>{match.disease}</Text>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: confColor }}>{match.confidencePercent}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <View style={{ width: `${match.confidencePercent}%`, height: 8, backgroundColor: confColor, borderRadius: 4 }} />
              </View>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginBottom: 12 }}>
                {match.reasoning}
              </Text>
              {match.protocolId && (
                <Pressable
                  onPress={() => router.push(`/protocol/${match.protocolId}`)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.accent, borderRadius: 8, padding: 10 }}
                >
                  <Feather name="book-open" size={15} color={colors.primary} />
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary }}>View Protocol</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
