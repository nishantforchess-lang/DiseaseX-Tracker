import { Feather } from "@expo/vector-icons";
import { useCreateOutbreakAlert, useListOutbreakAlerts } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "#DC2626", bg: "#FEF2F2", label: "ACTIVE" },
  monitoring: { color: "#F59E0B", bg: "#FFFBEB", label: "MONITORING" },
  resolved: { color: "#059669", bg: "#ECFDF5", label: "RESOLVED" },
};

export default function OutbreaksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [showForm, setShowForm] = useState(false);
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const { data: outbreaks, isLoading, refetch } = useListOutbreakAlerts();
  const createAlert = useCreateOutbreakAlert();

  const handleReport = async () => {
    if (!location.trim() || !summary.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await createAlert.mutateAsync({
        assessmentId: 1,
        location: location.trim(),
        symptomsSummary: summary.trim(),
        latitude: lat ? parseFloat(lat) : null,
        longitude: lon ? parseFloat(lon) : null,
      });
      refetch();
      setShowForm(false);
      setLocation(""); setSummary(""); setLat(""); setLon("");
    } catch {}
  };

  const inputStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontFamily: "Inter_400Regular" as const,
    fontSize: 15,
    color: colors.foreground,
    marginBottom: 12,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        backgroundColor: colors.secondary,
        paddingTop: topPad + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}>
        <View>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" }}>Outbreak Alerts</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
            Atypical case reports
          </Text>
        </View>
        <Pressable
          onPress={() => setShowForm(true)}
          style={{ backgroundColor: colors.critical, borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Feather name="alert-triangle" size={16} color="#fff" />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>Report</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={Array.isArray(outbreaks) ? outbreaks : []}
          keyExtractor={(o) => String(o.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80, gap: 12, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
              <Feather name="check-circle" size={40} color={colors.low} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12, textAlign: "center" }}>
                No outbreak alerts
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, marginTop: 4, textAlign: "center" }}>
                Tap Report to flag an atypical presentation
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;
            const date = new Date(item.reportedAt).toLocaleDateString();
            return (
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: cfg.color,
                padding: 16,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, flex: 1 }}>
                    {item.location}
                  </Text>
                  <View style={{ backgroundColor: cfg.bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 10, color: cfg.color, letterSpacing: 0.5 }}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, marginBottom: 8 }}>
                  {item.symptomsSummary}
                </Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>
                  Reported {date}
                  {item.latitude && item.longitude ? ` • GPS: ${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}` : ""}
                </Text>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
            paddingTop: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>
              Report Outbreak Alert
            </Text>
            <Pressable onPress={() => setShowForm(false)}>
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={80}
          >
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, marginBottom: 20 }}>
              Report an atypical presentation that does not match known disease patterns in your area.
            </Text>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Location *</Text>
            <TextInput style={inputStyle} placeholder="Village or region" placeholderTextColor={colors.mutedForeground} value={location} onChangeText={setLocation} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Symptoms Summary *</Text>
            <TextInput
              style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
              placeholder="Describe the atypical presentation..."
              placeholderTextColor={colors.mutedForeground}
              value={summary}
              onChangeText={setSummary}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Latitude</Text>
                <TextInput style={inputStyle} placeholder="e.g. 11.865" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" value={lat} onChangeText={setLat} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Longitude</Text>
                <TextInput style={inputStyle} placeholder="e.g. -15.597" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" value={lon} onChangeText={setLon} />
              </View>
            </View>
            <Pressable
              onPress={handleReport}
              disabled={createAlert.isPending || !location.trim() || !summary.trim()}
              style={{
                backgroundColor: location.trim() && summary.trim() ? colors.critical : colors.muted,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              {createAlert.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="alert-triangle" size={18} color="#fff" />
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" }}>Submit Alert</Text>
                </>
              )}
            </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  );
}
