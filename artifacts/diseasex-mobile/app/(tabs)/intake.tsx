import { Feather } from "@expo/vector-icons";
import { useCreateAssessment, useCreatePatient } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SYMPTOMS = [
  "Fever", "Chills", "Headache", "Vomiting", "Diarrhea",
  "Cough", "Difficulty breathing", "Chest pain", "Rapid breathing",
  "Neck stiffness", "Confusion", "Altered consciousness",
  "Pale/yellow skin", "Fatigue", "Loss of appetite",
  "Abdominal pain", "Rash", "Seizures", "Muscle aches", "Dehydration",
];

type Step = 1 | 2 | 3;

export default function IntakeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [tempCelsius, setTempCelsius] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [durationDays, setDurationDays] = useState("");

  const createPatient = useCreatePatient();
  const createAssessment = useCreateAssessment();
  const isSubmitting = createPatient.isPending || createAssessment.isPending;

  const toggleSymptom = (s: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !location.trim() || selectedSymptoms.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const patient = await createPatient.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        ageYears: ageYears ? parseInt(ageYears) : null,
        ageMonths: !ageYears && ageMonths ? parseInt(ageMonths) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
      });
      const assessment = await createAssessment.mutateAsync({
        patientId: patient.id,
        symptoms: selectedSymptoms,
        tempCelsius: tempCelsius ? parseFloat(tempCelsius) : null,
        heartRateBpm: heartRate ? parseInt(heartRate) : null,
        spo2Percent: spo2 ? parseInt(spo2) : null,
        durationDays: durationDays ? parseInt(durationDays) : null,
        notes: null,
      });
      router.push(`/results/${assessment.id}`);
      setStep(1);
      setName(""); setLocation(""); setAgeYears(""); setAgeMonths("");
      setWeightKg(""); setSelectedSymptoms([]); setTempCelsius("");
      setHeartRate(""); setSpo2(""); setDurationDays("");
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

  const labelStyle = {
    fontFamily: "Inter_600SemiBold" as const,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        backgroundColor: colors.secondary,
        paddingTop: topPad + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" }}>New Assessment</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <View key={s} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: s <= step ? colors.primary : "#334155",
            }} />
          ))}
        </View>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#94A3B8", marginTop: 6 }}>
          Step {step} of 3 — {step === 1 ? "Patient Info" : step === 2 ? "Symptoms" : "Vitals"}
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 100 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
      >
        {step === 1 && (
          <View>
            <Text style={labelStyle}>Full Name *</Text>
            <TextInput
              style={inputStyle}
              placeholder="Patient name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
            <Text style={labelStyle}>Location / Village *</Text>
            <TextInput
              style={inputStyle}
              placeholder="Region or village"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Age (Years)</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 4"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={ageYears}
                  onChangeText={setAgeYears}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Age (Months)</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 8"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={ageMonths}
                  onChangeText={setAgeMonths}
                />
              </View>
            </View>
            <Text style={labelStyle}>Weight (kg)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 15.5"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={weightKg}
              onChangeText={setWeightKg}
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground, marginBottom: 16 }}>
              Select all symptoms present. Tap each symptom to toggle.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SYMPTOMS.map((s) => {
                const selected = selectedSymptoms.includes(s);
                return (
                  <Pressable
                    key={s}
                    onPress={() => toggleSymptom(s)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 24,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.accent : colors.card,
                    }}
                  >
                    <Text style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: selected ? colors.primary : colors.foreground,
                    }}>
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedSymptoms.length > 0 && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.accent, borderRadius: 10 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary }}>
                  {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? "s" : ""} selected
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground, marginBottom: 16 }}>
              Vitals are optional but improve pattern matching accuracy.
            </Text>
            <Text style={labelStyle}>Temperature (°C)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 38.5"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={tempCelsius}
              onChangeText={setTempCelsius}
            />
            <Text style={labelStyle}>Heart Rate (bpm)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 120"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={heartRate}
              onChangeText={setHeartRate}
            />
            <Text style={labelStyle}>SpO2 (%)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 95"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={spo2}
              onChangeText={setSpo2}
            />
            <Text style={labelStyle}>Symptom Duration (days)</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 3"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={durationDays}
              onChangeText={setDurationDays}
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: bottomPad + 20,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: "row",
        gap: 12,
      }}>
        {step > 1 && (
          <Pressable
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
            onPress={() => setStep((s) => (s - 1) as Step)}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground }}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={{
            flex: 2,
            padding: 16,
            borderRadius: 12,
            backgroundColor: step === 3 && selectedSymptoms.length > 0 && name && location
              ? colors.primary
              : step < 3 && (step !== 1 || (name && location))
              ? colors.primary
              : colors.muted,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={step === 3 ? handleSubmit : () => {
            if (step === 1 && (!name.trim() || !location.trim())) return;
            if (step === 2 && selectedSymptoms.length === 0) return;
            setStep((s) => (s + 1) as Step);
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" }}>
                {step === 3 ? "Run Assessment" : "Continue"}
              </Text>
              <Feather name={step === 3 ? "zap" : "arrow-right"} size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
