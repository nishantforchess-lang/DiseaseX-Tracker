interface PatternMatch {
  disease: string;
  confidencePercent: number;
  reasoning: string;
  protocolId: number | null;
}

const DISEASE_RULES: Array<{
  disease: string;
  protocolId: number | null;
  score: (symptoms: string[], temp?: number | null, heartRate?: number | null, spo2?: number | null) => { score: number; reasoning: string };
}> = [
  {
    disease: "Severe Malaria",
    protocolId: 1,
    score: (symptoms, temp, _hr, spo2) => {
      let score = 0;
      const reasons: string[] = [];
      if (symptoms.includes("Fever")) { score += 35; reasons.push("Fever"); }
      if (symptoms.includes("Altered Consciousness")) { score += 30; reasons.push("Altered Consciousness"); }
      if (symptoms.includes("Anemia / Pale Conjunctiva")) { score += 20; reasons.push("Anemia"); }
      if (symptoms.includes("Seizures")) { score += 20; reasons.push("Seizures"); }
      if (symptoms.includes("Respiratory Distress")) { score += 10; reasons.push("Respiratory Distress"); }
      if (temp && temp > 38.5) { score += 10; reasons.push(`High temp ${temp}°C`); }
      if (spo2 && spo2 < 94) { score += 5; reasons.push(`Low SpO2 ${spo2}%`); }
      return { score: Math.min(score, 99), reasoning: `Matches: ${reasons.join(", ") || "No key indicators"}` };
    },
  },
  {
    disease: "Pneumonia",
    protocolId: 2,
    score: (symptoms, _temp, _hr, spo2) => {
      let score = 0;
      const reasons: string[] = [];
      if (symptoms.includes("Cough")) { score += 30; reasons.push("Cough"); }
      if (symptoms.includes("Respiratory Distress")) { score += 35; reasons.push("Respiratory Distress"); }
      if (symptoms.includes("Fever")) { score += 20; reasons.push("Fever"); }
      if (spo2 && spo2 < 94) { score += 20; reasons.push(`Low SpO2 ${spo2}%`); }
      if (symptoms.includes("Lethargy")) { score += 10; reasons.push("Lethargy"); }
      return { score: Math.min(score, 99), reasoning: `Matches: ${reasons.join(", ") || "No key indicators"}` };
    },
  },
  {
    disease: "Cholera / Severe Dehydration",
    protocolId: 3,
    score: (symptoms, _temp, heartRate) => {
      let score = 0;
      const reasons: string[] = [];
      if (symptoms.includes("Diarrhea")) { score += 35; reasons.push("Diarrhea"); }
      if (symptoms.includes("Dehydration")) { score += 35; reasons.push("Dehydration"); }
      if (symptoms.includes("Vomiting")) { score += 20; reasons.push("Vomiting"); }
      if (heartRate && heartRate > 100) { score += 15; reasons.push(`Tachycardia ${heartRate}bpm`); }
      if (symptoms.includes("Lethargy")) { score += 10; reasons.push("Lethargy"); }
      return { score: Math.min(score, 99), reasoning: `Matches: ${reasons.join(", ") || "No key indicators"}` };
    },
  },
  {
    disease: "Meningitis",
    protocolId: 4,
    score: (symptoms, temp) => {
      let score = 0;
      const reasons: string[] = [];
      if (symptoms.includes("Fever")) { score += 25; reasons.push("Fever"); }
      if (symptoms.includes("Altered Consciousness")) { score += 35; reasons.push("Altered Consciousness"); }
      if (symptoms.includes("Seizures")) { score += 30; reasons.push("Seizures"); }
      if (temp && temp > 39.0) { score += 15; reasons.push(`Very high temp ${temp}°C`); }
      return { score: Math.min(score, 99), reasoning: `Matches: ${reasons.join(", ") || "No key indicators"}` };
    },
  },
  {
    disease: "Severe Anemia",
    protocolId: 5,
    score: (symptoms, _temp, heartRate, spo2) => {
      let score = 0;
      const reasons: string[] = [];
      if (symptoms.includes("Anemia / Pale Conjunctiva")) { score += 50; reasons.push("Pale Conjunctiva"); }
      if (symptoms.includes("Lethargy")) { score += 20; reasons.push("Lethargy"); }
      if (symptoms.includes("Respiratory Distress")) { score += 15; reasons.push("Respiratory Distress"); }
      if (heartRate && heartRate > 110) { score += 15; reasons.push(`Tachycardia ${heartRate}bpm`); }
      if (spo2 && spo2 < 90) { score += 10; reasons.push(`Low SpO2 ${spo2}%`); }
      return { score: Math.min(score, 99), reasoning: `Matches: ${reasons.join(", ") || "No key indicators"}` };
    },
  },
];

export function runPatternMatcher(
  symptoms: string[],
  tempCelsius?: number | null,
  heartRateBpm?: number | null,
  spo2Percent?: number | null,
): { matches: PatternMatch[]; isAtypical: boolean } {
  const matches: PatternMatch[] = DISEASE_RULES.map((rule) => {
    const { score, reasoning } = rule.score(symptoms, tempCelsius, heartRateBpm, spo2Percent);
    return {
      disease: rule.disease,
      confidencePercent: score,
      reasoning,
      protocolId: rule.protocolId,
    };
  })
    .filter((m) => m.confidencePercent > 5)
    .sort((a, b) => b.confidencePercent - a.confidencePercent)
    .slice(0, 4);

  const hasHighConfidenceMatch = matches.some((m) => m.confidencePercent >= 50);
  const isAtypical = symptoms.length >= 3 && !hasHighConfidenceMatch;

  return { matches, isAtypical };
}
