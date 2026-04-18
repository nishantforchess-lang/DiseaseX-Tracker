import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePatient, useCreateAssessment, getListPatientsQueryKey, getGetPatientQueueQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Check, User, Activity, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

const SYMPTOM_OPTIONS = [
  "Fever",
  "Cough",
  "Diarrhea",
  "Lethargy",
  "Respiratory Distress",
  "Anemia / Pale Conjunctiva",
  "Dehydration",
  "Altered Consciousness",
  "Vomiting",
  "Seizures",
];

type Step = 1 | 2 | 3 | 4;

interface PatientData {
  name: string;
  ageYears: string;
  ageMonths: string;
  weightKg: string;
  location: string;
}

interface VitalsData {
  tempCelsius: string;
  heartRateBpm: string;
  spo2Percent: string;
  durationDays: string;
  notes: string;
}

export default function Intake() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [patient, setPatient] = useState<PatientData>({ name: "", ageYears: "", ageMonths: "", weightKg: "", location: "" });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<VitalsData>({ tempCelsius: "", heartRateBpm: "", spo2Percent: "", durationDays: "", notes: "" });

  const createPatient = useCreatePatient();
  const createAssessment = useCreateAssessment();
  const isSubmitting = createPatient.isPending || createAssessment.isPending;

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = () => {
    if (!patient.name || !patient.location) {
      toast({ title: "Missing required fields", description: "Patient name and location are required", variant: "destructive" });
      return;
    }
    if (symptoms.length === 0) {
      toast({ title: "Select at least one symptom", variant: "destructive" });
      return;
    }

    createPatient.mutate({
      data: {
        name: patient.name,
        location: patient.location,
        ageYears: patient.ageYears ? parseInt(patient.ageYears) : null,
        ageMonths: patient.ageMonths ? parseInt(patient.ageMonths) : null,
        weightKg: patient.weightKg ? parseFloat(patient.weightKg) : null,
      }
    }, {
      onSuccess: (newPatient) => {
        createAssessment.mutate({
          data: {
            patientId: newPatient.id,
            symptoms,
            tempCelsius: vitals.tempCelsius ? parseFloat(vitals.tempCelsius) : null,
            heartRateBpm: vitals.heartRateBpm ? parseInt(vitals.heartRateBpm) : null,
            spo2Percent: vitals.spo2Percent ? parseInt(vitals.spo2Percent) : null,
            durationDays: vitals.durationDays ? parseInt(vitals.durationDays) : null,
            notes: vitals.notes || null,
          }
        }, {
          onSuccess: (assessment) => {
            queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPatientQueueQueryKey() });
            toast({ title: "Assessment submitted", description: "Pattern matching complete" });
            setLocation(`/results/${assessment.id}`);
          },
          onError: () => {
            toast({ title: "Failed to create assessment", variant: "destructive" });
          }
        });
      },
      onError: () => {
        toast({ title: "Failed to create patient", variant: "destructive" });
      }
    });
  };

  const steps = [
    { num: 1, label: "Patient Info", icon: User },
    { num: 2, label: "Symptoms", icon: Activity },
    { num: 3, label: "Vitals", icon: Thermometer },
    { num: 4, label: "Review", icon: Check },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">New Assessment</h1>
        <p className="text-muted-foreground text-sm">Complete all steps to run pattern matching</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm shrink-0 transition-all",
              step === s.num ? "border-primary bg-primary text-primary-foreground" :
              step > s.num ? "border-emerald-600 bg-emerald-600 text-white" :
              "border-muted-foreground/30 text-muted-foreground"
            )}>
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            {idx < steps.length - 1 && <div className={cn("flex-1 h-1 mx-1", step > s.num ? "bg-emerald-600" : "bg-muted")} />}
          </div>
        ))}
      </div>

      {/* Step 1: Patient Info */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Patient Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Patient Name *</Label>
              <Input id="name" className="mt-1 h-12" placeholder="Full name" value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} data-testid="input-name" />
            </div>
            <div>
              <Label htmlFor="location">Location / Village *</Label>
              <Input id="location" className="mt-1 h-12" placeholder="Village, district, or region" value={patient.location} onChange={e => setPatient(p => ({ ...p, location: e.target.value }))} data-testid="input-location" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ageYears">Age (Years)</Label>
                <Input id="ageYears" type="number" min="0" className="mt-1 h-12" placeholder="0" value={patient.ageYears} onChange={e => setPatient(p => ({ ...p, ageYears: e.target.value }))} data-testid="input-age-years" />
              </div>
              <div>
                <Label htmlFor="ageMonths">Age (Months)</Label>
                <Input id="ageMonths" type="number" min="0" max="11" className="mt-1 h-12" placeholder="0" value={patient.ageMonths} onChange={e => setPatient(p => ({ ...p, ageMonths: e.target.value }))} data-testid="input-age-months" />
              </div>
              <div>
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input id="weightKg" type="number" min="0" step="0.1" className="mt-1 h-12" placeholder="0.0" value={patient.weightKg} onChange={e => setPatient(p => ({ ...p, weightKg: e.target.value }))} data-testid="input-weight" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Symptom Checklist</CardTitle>
            <p className="text-sm text-muted-foreground">Select all that apply. {symptoms.length} selected.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOM_OPTIONS.map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left font-semibold transition-all min-h-[64px] flex items-center",
                    symptoms.includes(symptom)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/40 hover:bg-muted/50"
                  )}
                  data-testid={`button-symptom-${symptom.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span className="flex items-center gap-2">
                    {symptoms.includes(symptom) && <Check className="h-4 w-4 shrink-0" />}
                    {symptom}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Vitals */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5 text-primary" /> Vitals (Optional but Recommended)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="temp">Temp (°C)</Label>
                <Input id="temp" type="number" step="0.1" className="mt-1 h-12" placeholder="e.g. 38.5" value={vitals.tempCelsius} onChange={e => setVitals(v => ({ ...v, tempCelsius: e.target.value }))} data-testid="input-temp" />
              </div>
              <div>
                <Label htmlFor="hr">Heart Rate (bpm)</Label>
                <Input id="hr" type="number" className="mt-1 h-12" placeholder="e.g. 110" value={vitals.heartRateBpm} onChange={e => setVitals(v => ({ ...v, heartRateBpm: e.target.value }))} data-testid="input-hr" />
              </div>
              <div>
                <Label htmlFor="spo2">SpO2 (%)</Label>
                <Input id="spo2" type="number" min="0" max="100" className="mt-1 h-12" placeholder="e.g. 94" value={vitals.spo2Percent} onChange={e => setVitals(v => ({ ...v, spo2Percent: e.target.value }))} data-testid="input-spo2" />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Duration of Illness (Days)</Label>
              <Input id="duration" type="number" min="0" className="mt-1 h-12" placeholder="e.g. 3" value={vitals.durationDays} onChange={e => setVitals(v => ({ ...v, durationDays: e.target.value }))} data-testid="input-duration" />
            </div>
            <div>
              <Label htmlFor="notes">Clinical Notes</Label>
              <textarea id="notes" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Additional observations..." value={vitals.notes} onChange={e => setVitals(v => ({ ...v, notes: e.target.value }))} data-testid="input-notes" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Review Before Submission</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-1">
              <div className="font-bold text-lg">{patient.name}</div>
              <div className="text-sm text-muted-foreground">
                {patient.ageYears ? `${patient.ageYears} years` : patient.ageMonths ? `${patient.ageMonths} months` : 'Age unknown'}
                {patient.weightKg ? ` · ${patient.weightKg} kg` : ''} · {patient.location}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Symptoms ({symptoms.length})</div>
              <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                  <span key={s} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">{s}</span>
                ))}
              </div>
            </div>
            {(vitals.tempCelsius || vitals.heartRateBpm || vitals.spo2Percent) && (
              <div>
                <div className="font-semibold mb-2">Vitals</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {vitals.tempCelsius && <div className="bg-muted rounded p-2 text-center"><div className="font-bold">{vitals.tempCelsius}°C</div><div className="text-muted-foreground">Temp</div></div>}
                  {vitals.heartRateBpm && <div className="bg-muted rounded p-2 text-center"><div className="font-bold">{vitals.heartRateBpm}</div><div className="text-muted-foreground">bpm</div></div>}
                  {vitals.spo2Percent && <div className="bg-muted rounded p-2 text-center"><div className="font-bold">{vitals.spo2Percent}%</div><div className="text-muted-foreground">SpO2</div></div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" size="lg" className="flex-1 h-14" onClick={() => setStep(s => (s - 1) as Step)} data-testid="button-prev">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back
          </Button>
        )}
        {step < 4 ? (
          <Button size="lg" className="flex-1 h-14" onClick={() => setStep(s => (s + 1) as Step)} disabled={step === 1 && (!patient.name || !patient.location)} data-testid="button-next">
            Next <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        ) : (
          <Button size="lg" className="flex-1 h-14 bg-primary" onClick={handleSubmit} disabled={isSubmitting} data-testid="button-submit">
            {isSubmitting ? "Analyzing..." : "Run Pattern Analysis"}
          </Button>
        )}
      </div>
    </div>
  );
}
