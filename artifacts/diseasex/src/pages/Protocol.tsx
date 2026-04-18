import { useState } from "react";
import { useParams } from "wouter";
import { useGetProtocol, useLogFirstDose, getGetProtocolQueryKey, getGetAssessmentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, ChevronRight, Calculator, Pill, Clock } from "lucide-react";

export default function Protocol() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: protocol, isLoading } = useGetProtocol(id, {
    query: { enabled: !!id, queryKey: getGetProtocolQueryKey(id) }
  });

  const [weight, setWeight] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [showDoseForm, setShowDoseForm] = useState(false);
  const [drug, setDrug] = useState("");
  const [doseLogged, setDoseLogged] = useState(false);
  const [doseTime, setDoseTime] = useState<string | null>(null);

  const logFirstDose = useLogFirstDose();

  const calcDose = () => {
    if (!weight || !protocol?.dosageFormula) return null;
    const wt = parseFloat(weight);
    if (isNaN(wt)) return null;
    const match = protocol.dosageFormula.match(/([\d.]+)\s*mg\/kg/);
    if (match) {
      const mgPerKg = parseFloat(match[1]);
      return `${(mgPerKg * wt).toFixed(1)} mg`;
    }
    return protocol.dosageFormula;
  };

  const handleLogDose = () => {
    if (!assessmentId) {
      toast({ title: "Enter the Assessment ID to log a dose", variant: "destructive" });
      return;
    }
    if (!drug) {
      toast({ title: "Enter the drug administered", variant: "destructive" });
      return;
    }
    const aId = parseInt(assessmentId);
    if (isNaN(aId)) {
      toast({ title: "Invalid assessment ID", variant: "destructive" });
      return;
    }

    logFirstDose.mutate({ id: aId, data: { drug } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAssessmentQueryKey(aId) });
        setDoseLogged(true);
        setDoseTime(new Date().toLocaleTimeString());
        setShowDoseForm(false);
        toast({ title: "First dose logged", description: `${drug} administered at ${new Date().toLocaleTimeString()}` });
      },
      onError: () => {
        toast({ title: "Failed to log dose", variant: "destructive" });
      }
    });
  };

  const severityColors: Record<string, string> = {
    mild: "bg-emerald-100 text-emerald-800",
    moderate: "bg-amber-100 text-amber-800",
    severe: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!protocol) {
    return <div className="text-center py-12 text-muted-foreground">Protocol not found.</div>;
  }

  const dose = calcDose();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge className={severityColors[protocol.severity] || "bg-muted"}>
            {protocol.severity.toUpperCase()}
          </Badge>
          {protocol.whoBased && <Badge variant="outline" className="text-xs">WHO Protocol</Badge>}
        </div>
        <h1 className="text-2xl font-bold">{protocol.title}</h1>
        <p className="text-muted-foreground">{protocol.disease}</p>
      </div>

      {/* Immediate Action — most prominent */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-700 flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5" /> IMMEDIATE ACTION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-red-800 text-lg leading-snug">{protocol.immediateAction}</p>
        </CardContent>
      </Card>

      {/* Dosage calculator */}
      {protocol.dosageFormula && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-5 w-5 text-primary" /> Dosage Calculator</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Formula: <span className="font-mono font-bold text-foreground">{protocol.dosageFormula}</span></p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="weight">Patient Weight (kg)</Label>
                <Input id="weight" type="number" min="0" step="0.1" className="mt-1 h-12" placeholder="Enter weight in kg" value={weight} onChange={e => setWeight(e.target.value)} data-testid="input-dosage-weight" />
              </div>
              {dose && (
                <div className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-center shrink-0">
                  <div className="text-2xl font-bold">{dose}</div>
                  <div className="text-xs opacity-80">Calculated Dose</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment steps */}
      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base">Treatment Steps</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ol className="space-y-3">
            {protocol.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">{idx + 1}</div>
                <p className="text-sm leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Drugs */}
      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-base"><Pill className="h-5 w-5 text-primary" /> Required Medications</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {protocol.drugs.map(drug => (
              <span key={drug} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium" data-testid={`drug-${drug.toLowerCase().replace(/\s+/g, '-')}`}>{drug}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral threshold */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-base"><ChevronRight className="h-5 w-5" /> Referral Threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900 font-medium">{protocol.referralThreshold}</p>
        </CardContent>
      </Card>

      {/* First dose logging */}
      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-5 w-5 text-primary" /> Log First Dose Administered</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {doseLogged ? (
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 rounded-lg p-4" data-testid="badge-dose-logged">
              <CheckCircle className="h-6 w-6" />
              <div>
                <div className="font-bold">First dose logged at {doseTime}</div>
                <div className="text-sm">Drug: {drug}</div>
              </div>
            </div>
          ) : !showDoseForm ? (
            <Button className="w-full h-14 text-base" onClick={() => setShowDoseForm(true)} data-testid="button-log-dose">
              Log First Dose Administered
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="assessmentId">Assessment ID</Label>
                <Input id="assessmentId" type="number" className="mt-1 h-12" placeholder="Enter assessment ID from results" value={assessmentId} onChange={e => setAssessmentId(e.target.value)} data-testid="input-assessment-id" />
              </div>
              <div>
                <Label htmlFor="drugName">Drug Administered</Label>
                <Input id="drugName" className="mt-1 h-12" placeholder={`e.g. ${protocol.drugs[0] || 'Drug name'}`} value={drug} onChange={e => setDrug(e.target.value)} data-testid="input-drug-name" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDoseForm(false)} data-testid="button-cancel-dose">Cancel</Button>
                <Button className="flex-1" onClick={handleLogDose} disabled={logFirstDose.isPending} data-testid="button-confirm-dose">
                  {logFirstDose.isPending ? "Logging..." : "Confirm Dose"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
