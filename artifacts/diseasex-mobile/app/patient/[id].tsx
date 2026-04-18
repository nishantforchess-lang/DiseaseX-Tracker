import { Feather } from "@expo/vector-icons";
import { useGetPatient, useListAssessments } from "@workspace/api-client-react";
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

export default function PatientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: patient, isLoading: patientLoading } = useGetPatient(Number(id));
  const { data: assessments, isLoading: assessLoading } = useListAssessments(
    { patientId: Number(id) },
    { query: { enabled: !!id } }
  );

  if (patientLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="alert-circle" size={40} color={colors.critical} />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12 }}>Patient not found</Text>
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    active: colors.primary,
    discharged: colors.low,
    referred: colors.monitor,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: bottomPad + 24 }}>
      <View style={{ backgroundColor: colors.secondary, padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff" }}>{patient.name}</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94A3B8", marginTop: 4 }}>
              {patient.ageYears ? `${patient.ageYears} years` : patient.ageMonths ? `${patient.ageMonths} months` : "Age unknown"}
              {patient.weightKg ? ` • ${patient.weightKg} kg` : ""}
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
              {patient.location}
            </Text>
          </View>
          <View style={{
            backgroundColor: statusColors[patient.status] + "33",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: statusColors[patient.status], textTransform: "uppercase", letterSpacing: 0.5 }}>
              {patient.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>Assessments</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/intake")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>New</Text>
          </Pressable>
        </View>

        {assessLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (assessments ?? []).length === 0 ? (
          <View style={{ alignItems: "center", padding: 24, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <Feather name="clipboard" size={32} color={colors.mutedForeground} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.mutedForeground, marginTop: 8 }}>No assessments yet</Text>
          </View>
        ) : (
          (assessments ?? []).map((a) => {
            const topMatch = a.patternMatches?.[0];
            const date = new Date(a.createdAt).toLocaleDateString();
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/results/${a.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 10,
                })}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground }}>
                      {topMatch ? topMatch.disease : "No match"}
                      {topMatch ? ` — ${topMatch.confidencePercent}%` : ""}
                    </Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                      {a.symptoms.slice(0, 3).join(", ")}{a.symptoms.length > 3 ? ` +${a.symptoms.length - 3}` : ""}
                    </Text>
                    {a.tempCelsius && (
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                        Temp: {a.tempCelsius}°C{a.spo2Percent ? ` • SpO2: ${a.spo2Percent}%` : ""}{a.heartRateBpm ? ` • HR: ${a.heartRateBpm}` : ""}
                      </Text>
                    )}
                    {a.isAtypical && (
                      <View style={{ backgroundColor: colors.criticalBg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 6 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.critical }}>ATYPICAL</Text>
                      </View>
                    )}
                    {a.firstDoseDrug && (
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.low, marginTop: 4 }}>
                        First dose: {a.firstDoseDrug}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>{date}</Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
