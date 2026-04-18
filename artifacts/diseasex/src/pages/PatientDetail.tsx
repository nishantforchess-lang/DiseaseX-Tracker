import { useParams, useLocation } from "wouter";
import { useGetPatient, useListAssessments, useUpdatePatient, getGetPatientQueryKey, getListAssessmentsQueryKey, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, User, Activity, Clock, Plus } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const statusColors: Record<string, string> = {
  active: "bg-emerald-600 text-white",
  referred: "bg-amber-500 text-white",
  discharged: "bg-muted text-muted-foreground",
};

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: loadingPatient } = useGetPatient(id, {
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(id) }
  });

  const { data: assessments, isLoading: loadingAssessments } = useListAssessments({ patientId: id }, {
    query: { enabled: !!id, queryKey: getListAssessmentsQueryKey({ patientId: id }) }
  });

  const updatePatient = useUpdatePatient();

  const handleStatusChange = (status: "active" | "discharged" | "referred") => {
    updatePatient.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        toast({ title: `Patient status updated to ${status}` });
      },
      onError: () => {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    });
  };

  if (loadingPatient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Patient not found.</div>;
  }

  const sortedAssessments = assessments?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  return (
    <div className="space-y-6">
      {/* Patient header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-3"><User className="h-8 w-8 text-primary" /></div>
              <div>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <div className="text-muted-foreground text-sm mt-1">
                  {patient.ageYears ? `${patient.ageYears} years` : patient.ageMonths ? `${patient.ageMonths} months` : 'Age unknown'}
                  {patient.weightKg ? ` · ${patient.weightKg} kg` : ''} · {patient.location}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusColors[patient.status] || "bg-muted"}>{patient.status.toUpperCase()}</Badge>
                  <span className="text-xs text-muted-foreground">Registered {formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {patient.status !== 'active' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("active")} disabled={updatePatient.isPending} data-testid="button-mark-active">Mark Active</Button>
              )}
              {patient.status !== 'referred' && (
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => handleStatusChange("referred")} disabled={updatePatient.isPending} data-testid="button-mark-referred">Mark Referred</Button>
              )}
              {patient.status !== 'discharged' && (
                <Button size="sm" variant="outline" className="border-muted" onClick={() => handleStatusChange("discharged")} disabled={updatePatient.isPending} data-testid="button-mark-discharged">Discharge</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New assessment CTA */}
      <Button size="lg" className="w-full h-14" asChild data-testid="button-new-assessment">
        <Link href="/intake">
          <Plus className="h-5 w-5 mr-2" /> Start New Assessment for this Patient
        </Link>
      </Button>

      {/* Assessment history */}
      <div>
        <h2 className="text-lg font-bold mb-4">Assessment History ({sortedAssessments.length})</h2>
        {loadingAssessments ? (
          [1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg mb-3" />)
        ) : sortedAssessments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg">
            <Activity className="h-12 w-12 opacity-20 mx-auto mb-2" />
            <p>No assessments recorded for this patient.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAssessments.map(assessment => {
              const matches = assessment.patternMatches as Array<{ disease: string; confidencePercent: number }>;
              const topMatch = matches?.[0];
              return (
                <Card key={assessment.id} className={assessment.isAtypical ? 'border-red-200' : ''} data-testid={`card-assessment-${assessment.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(assessment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          {assessment.firstDoseAt && (
                            <Badge className="bg-emerald-100 text-emerald-800 ml-1">First Dose Logged</Badge>
                          )}
                          {assessment.isAtypical && (
                            <Badge className="bg-red-100 text-red-800 ml-1">Atypical</Badge>
                          )}
                        </div>
                        {topMatch && (
                          <div className="font-semibold text-primary">{topMatch.disease} — {topMatch.confidencePercent}% match</div>
                        )}
                        <div className="text-sm text-muted-foreground line-clamp-1">Symptoms: {assessment.symptoms.join(", ")}</div>
                      </div>
                      <Button size="sm" variant="outline" asChild data-testid={`button-view-assessment-${assessment.id}`}>
                        <Link href={`/results/${assessment.id}`}>Results <ArrowRight className="h-4 w-4 ml-1" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
