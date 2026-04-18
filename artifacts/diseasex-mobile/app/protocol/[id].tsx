import { Feather } from "@expo/vector-icons";
import { useGetProtocol } from "@workspace/api-client-react";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#DC2626", bg: "#FEF2F2" },
  severe: { color: "#DC2626", bg: "#FEF2F2" },
  moderate: { color: "#F59E0B", bg: "#FFFBEB" },
  mild: { color: "#059669", bg: "#ECFDF5" },
};

export default function ProtocolDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [weight, setWeight] = useState("");

  const { data: protocol, isLoading } = useGetProtocol(Number(id));

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!protocol) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="alert-circle" size={40} color={colors.critical} />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12 }}>Protocol not found</Text>
      </View>
    );
  }

  const sev = SEVERITY_CONFIG[protocol.severity] ?? SEVERITY_CONFIG.moderate;
  const w = parseFloat(weight);
  let calculatedDose = "";
  if (protocol.dosageFormula && !isNaN(w) && w > 0) {
    const match = protocol.dosageFormula.match(/(\d+(?:\.\d+)?)\s*mg\/kg/i);
    if (match) {
      const mgPerKg = parseFloat(match[1]);
      const dose = mgPerKg * w;
      calculatedDose = `${dose.toFixed(1)} mg`;
    } else {
      calculatedDose = `Apply formula: ${protocol.dosageFormula} for ${w} kg`;
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: bottomPad + 24 }}>
      <View style={{ backgroundColor: colors.secondary, padding: 20 }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <View style={{ backgroundColor: sev.bg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: sev.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {protocol.severity}
            </Text>
          </View>
          {protocol.whoBased && (
            <View style={{ backgroundColor: "#0D9488", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff", letterSpacing: 0.5 }}>WHO PROTOCOL</Text>
            </View>
          )}
        </View>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" }}>{protocol.disease}</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94A3B8", marginTop: 4 }}>{protocol.title}</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.criticalBg, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.critical, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.critical, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Immediate Action
          </Text>
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.critical }}>
            {protocol.immediateAction}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, marginBottom: 12 }}>Treatment Steps</Text>
          {protocol.steps.map((step, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, flex: 1, lineHeight: 22 }}>{step}</Text>
            </View>
          ))}
        </View>

        {protocol.dosageFormula && (
          <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, marginBottom: 4 }}>Dosage Calculator</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginBottom: 12 }}>
              {protocol.dosageFormula}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={{
                    backgroundColor: colors.muted,
                    borderRadius: 10,
                    padding: 14,
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                  placeholder="Weight (kg)"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              {calculatedDose ? (
                <View style={{ backgroundColor: colors.accent, borderRadius: 10, padding: 14, flex: 1, alignItems: "center" }}>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.primary }}>First Dose</Text>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.primary }}>{calculatedDose}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, marginBottom: 10 }}>Medications</Text>
          {protocol.drugs.map((drug, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Feather name="package" size={16} color={colors.primary} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground }}>{drug}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.monitorBg, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.monitor, padding: 16 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.monitor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Referral Threshold
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground }}>
            {protocol.referralThreshold}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
