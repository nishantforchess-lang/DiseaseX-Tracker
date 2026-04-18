import { useParams, useLocation } from "wouter";
import { useGetAssessment, useGetPatient, getGetAssessmentQueryKey, getGetPatientQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight, Activity, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

function ConfidenceBar({ value, disease }: { value: number; disease: string }) {
  const color = value >= 70 ? "bg-red-600" : value >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const badgeClass = value >= 70 ? "bg-red-600 text-white" : value >= 40 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";
  return (
    <div className="space-y-1" data-testid={`match-${disease.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">{disease}</span>
        <Badge className={badgeClass}>{value}% Match</Badge>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Results() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();

  const { data: assessment, isLoading: loadingAssessment } = useGetAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) }
  });

  const { data: patient, isLoading: loadingPatient } = useGetPatient(assessment?.patientId ?? 0, {
    query: { enabled: !!assessment?.patientId, queryKey: getGetPatientQueryKey(assessment?.patientId ?? 0) }
  });

  if (loadingAssessment || loadingPatient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assessment not found.</p>
        <Button className="mt-4" onClick={() => setLocation("/")} data-testid="button-home">Go to Dashboard</Button>
      </div>
    );
  }

  const matches = assessment.patternMatches as Array<{ disease: string; confidencePercent: number; reasoning: string; protocolId: number | null }>;
  const topMatch = matches?.[0];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
          <Clock className="h-4 w-4" />
          {formatDistanceToNow(new Date(assessment.createdAt), { addSuffix: true })}
        </div>
        <h1 className="text-2xl font-bold">Pattern Analysis Results</h1>
        {patient && (
          <p className="text-muted-foreground">
            {patient.name} · {patient.ageYears ? `${patient.ageYears}y` : patient.ageMonths ? `${patient.ageMonths}mo` : 'Age unknown'} · {patient.location}
          </p>
        )}
      </div>

      {/* Atypical case alert */}
      {assessment.isAtypical && (
        <div className="bg-red-600 text-white rounded-lg p-4 flex items-start gap-3" data-testid="banner-atypical">
          <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-lg">ATYPICAL CASE — Low Confidence for All Known Diseases</div>
            <p className="text-sm mt-1 opacity-90">This presentation does not fit known disease patterns with sufficient confidence. Consider reporting as a potential novel outbreak to district health officials.</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-white text-white hover:bg-white/20 hover:text-white bg-transparent" asChild data-testid="button-report-outbreak">
            <Link href="/outbreaks">Report Outbreak</Link>
          </Button>
        </div>
      )}

      {/* Top recommendation */}
      {topMatch && topMatch.confidencePercent >= 40 && (
        <Card className="border-primary shadow-md">
          <CardHeader className="bg-primary/5 border-b pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" /> Top Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-bold">{topMatch.disease}</div>
                <div className="text-sm text-muted-foreground mt-1">{topMatch.reasoning}</div>
              </div>
              <Badge className="bg-red-600 text-white text-lg px-3 py-1 shrink-0 ml-2">{topMatch.confidencePercent}%</Badge>
            </div>
            {topMatch.protocolId && (
              <Button className="w-full h-14 text-base" asChild data-testid="button-view-protocol">
                <Link href={`/protocol/${topMatch.protocolId}`}>
                  View Treatment Protocol <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Probability stack */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Probability Stack — All Matches</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {matches && matches.length > 0 ? (
            matches.map(m => (
              <div key={m.disease} className="space-y-2">
                <ConfidenceBar value={m.confidencePercent} disease={m.disease} />
                <div className="text-xs text-muted-foreground pl-1">{m.reasoning}</div>
                {m.protocolId && (
                  <Link href={`/protocol/${m.protocolId}`} className="text-xs text-primary hover:underline pl-1 flex items-center gap-1">
                    View {m.disease} Protocol <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-12 w-12 opacity-20 mx-auto mb-2" />
              <p>No disease patterns matched the recorded symptoms.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Symptoms recorded */}
      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base">Recorded Symptoms</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {assessment.symptoms.map(s => (
              <span key={s} className="bg-muted px-3 py-1 rounded-full text-sm font-medium">{s}</span>
            ))}
          </div>
          {(assessment.tempCelsius || assessment.heartRateBpm || assessment.spo2Percent) && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {assessment.tempCelsius && <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold">{assessment.tempCelsius}°C</div><div className="text-xs text-muted-foreground">Temp</div></div>}
              {assessment.heartRateBpm && <div className="bg-muted rounded-lg p-2 text-center"><div className="text-lg font-bold">{assessment.heartRateBpm}</div><div className="text-xs text-muted-foreground">bpm</div></div>}
              {assessment.spo2Percent && <div className={`rounded-lg p-2 text-center ${assessment.spo2Percent < 94 ? 'bg-red-100 text-red-700' : 'bg-muted'}`}><div className="text-lg font-bold">{assessment.spo2Percent}%</div><div className="text-xs">SpO2</div></div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" asChild data-testid="button-view-patient">
          <Link href={`/patient/${assessment.patientId}`}>View Patient Record</Link>
        </Button>
        <Button size="lg" className="flex-1" asChild data-testid="button-new-assessment">
          <Link href="/intake">New Assessment</Link>
        </Button>
      </div>
    </div>
  );
}
