import { Link } from "wouter";
import { useGetDashboardSummary, useGetPatientQueue, useListOutbreakAlerts, getGetDashboardSummaryQueryKey, getGetPatientQueueQueryKey, getListOutbreakAlertsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, Activity, Users, FileText, AlertCircle, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  
  const { data: queue, isLoading: isLoadingQueue } = useGetPatientQueue({
    query: { queryKey: getGetPatientQueueQueryKey() }
  });

  const { data: outbreaks, isLoading: isLoadingOutbreaks } = useListOutbreakAlerts({
    query: { queryKey: getListOutbreakAlertsQueryKey() }
  });

  const activeOutbreaks = outbreaks?.filter(o => o.status === 'active') || [];

  return (
    <div className="space-y-6">
      {/* Outbreak Alert Banner */}
      {!isLoadingOutbreaks && activeOutbreaks.length > 0 && (
        <div className="rounded-lg bg-destructive p-4 flex items-start gap-4 text-destructive-foreground shadow-md" data-testid="banner-outbreak">
          <AlertTriangle className="h-6 w-6 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-none mb-1">ACTIVE OUTBREAK ALERTS ({activeOutbreaks.length})</h3>
            <p className="text-sm opacity-90">{activeOutbreaks[0].location}: {activeOutbreaks[0].symptomsSummary}</p>
          </div>
          <Button variant="outline" size="sm" className="bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive" asChild>
            <Link href="/outbreaks" data-testid="link-view-outbreaks">View All</Link>
          </Button>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button size="lg" className="h-24 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" asChild data-testid="button-start-assessment">
          <Link href="/intake" className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8" />
            <div className="text-left">
              <div className="font-bold">Start New Assessment</div>
              <div className="text-sm font-normal opacity-80">Patient Intake & Triage</div>
            </div>
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="h-24 text-lg shadow-sm" asChild data-testid="button-view-queue">
          <Link href="/queue" className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div className="text-left">
              <div className="font-bold">View Patient Queue</div>
              <div className="text-sm font-normal text-muted-foreground">Monitor active cases</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Live Stats Strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Cases" value={summary?.activeCases} icon={Users} isLoading={isLoadingSummary} testId="stat-active-cases" />
        <StatCard title="Critical Cases" value={summary?.criticalCases} icon={Activity} isLoading={isLoadingSummary} className="border-destructive/50 bg-destructive/5" valueClassName="text-destructive" testId="stat-critical-cases" />
        <StatCard title="Assessments Today" value={summary?.assessmentsToday} icon={FileText} isLoading={isLoadingSummary} testId="stat-assessments" />
        <StatCard title="Atypical Cases" value={summary?.atypicalCasesThisWeek} icon={AlertCircle} isLoading={isLoadingSummary} className="border-warning/50 bg-warning/5" valueClassName="text-warning" testId="stat-atypical" />
      </div>

      {/* Patient Queue Preview */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">Critical & Monitor Queue</CardTitle>
          <Button variant="ghost" size="sm" asChild data-testid="link-all-queue">
            <Link href="/queue" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingQueue ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !queue || queue.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Users className="h-12 w-12 opacity-20 mb-2" />
              <p className="font-medium">No active patients in queue</p>
            </div>
          ) : (
            <div className="divide-y">
              {queue.slice(0, 5).map((entry) => (
                <Link key={entry.patient.id} href={`/patient/${entry.patient.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors" data-testid={`link-patient-${entry.patient.id}`}>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {entry.patient.name}
                      {entry.urgency === 'critical' && <Badge className="bg-destructive hover:bg-destructive">CRITICAL</Badge>}
                      {entry.urgency === 'monitor' && <Badge className="bg-warning hover:bg-warning text-warning-foreground">MONITOR</Badge>}
                      {entry.urgency === 'low' && <Badge className="bg-success hover:bg-success">LOW RISK</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{entry.patient.ageYears ? `${entry.patient.ageYears}y` : entry.patient.ageMonths ? `${entry.patient.ageMonths}m` : 'Unknown age'}</span>
                      <span>•</span>
                      <span>{entry.patient.location}</span>
                      {entry.topMatch && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-foreground">{entry.topMatch.disease}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, className, valueClassName, testId }: any) {
  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Icon className="h-6 w-6 text-muted-foreground mb-2" />
        <div className="text-sm font-medium text-muted-foreground mb-1">{title}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-3xl font-bold ${valueClassName || ''}`} data-testid={testId}>{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}