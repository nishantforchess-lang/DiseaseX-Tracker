import { Feather } from "@expo/vector-icons";
import { useListProtocols } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
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

export default function ProtocolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [search, setSearch] = useState("");
  const { data: protocols, isLoading } = useListProtocols({ search: search || undefined });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        backgroundColor: colors.secondary,
        paddingTop: topPad + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" }}>Protocols</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
          WHO treatment guidelines
        </Text>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#334155",
          borderRadius: 10,
          marginTop: 12,
          paddingHorizontal: 12,
          gap: 8,
        }}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search protocols..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, height: 42, fontFamily: "Inter_400Regular", fontSize: 15, color: "#fff" }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={protocols ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80, gap: 12 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 40 }}>
              <Feather name="book-open" size={40} color={colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, marginTop: 12, textAlign: "center" }}>
                No protocols found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const sev = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.moderate;
            return (
              <Pressable
                onPress={() => router.push(`/protocol/${item.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                })}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View style={{ backgroundColor: sev.bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: sev.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {item.severity}
                        </Text>
                      </View>
                      {item.whoBased && (
                        <View style={{ backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary }}>WHO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>{item.disease}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, marginTop: 8 }} numberOfLines={2}>
                      {item.immediateAction}
                    </Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 8 }}>
                      {item.drugs.join(", ")}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
