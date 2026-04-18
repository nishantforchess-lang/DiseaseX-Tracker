import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetPatientQueue, getGetPatientQueueQueryKey } from "@workspace/api-client-react";
import { Search, AlertTriangle, ArrowRight, Activity, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function Queue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "monitor" | "low">("all");

  const { data: queue, isLoading } = useGetPatientQueue({
    query: { queryKey: getGetPatientQueueQueryKey() }
  });

  const filteredQueue = useMemo(() => {
    if (!queue) return [];
    return queue.filter(entry => {
      const matchesSearch = entry.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.patient.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "all" || entry.urgency === filter;
      return matchesSearch && matchesFilter;
    });
  }, [queue, searchTerm, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Queue</h1>
        <p className="text-muted-foreground">Active cases requiring monitoring or treatment</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            className="pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-queue"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} className="h-12 px-4 whitespace-nowrap" data-testid="button-filter-all">All</Button>
          <Button variant="outline" onClick={() => setFilter("critical")} className={`h-12 px-4 whitespace-nowrap ${filter === 'critical' ? 'bg-red-600 text-white border-red-600' : 'text-red-600 border-red-200'}`} data-testid="button-filter-critical">Critical</Button>
          <Button variant="outline" onClick={() => setFilter("monitor")} className={`h-12 px-4 whitespace-nowrap ${filter === 'monitor' ? 'bg-amber-600 text-white border-amber-600' : 'text-amber-600 border-amber-200'}`} data-testid="button-filter-monitor">Monitor</Button>
          <Button variant="outline" onClick={() => setFilter("low")} className={`h-12 px-4 whitespace-nowrap ${filter === 'low' ? 'bg-emerald-600 text-white border-emerald-600' : 'text-emerald-600 border-emerald-200'}`} data-testid="button-filter-low">Low Risk</Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border rounded-lg shadow-sm flex flex-col items-center">
            <Activity className="h-16 w-16 opacity-20 mb-4" />
            <h3 className="text-xl font-bold text-foreground">No patients found</h3>
            <p className="mt-2">No active cases match your current filters.</p>
            {(searchTerm || filter !== 'all') && (
              <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setFilter("all"); }} data-testid="button-clear-filters">Clear Filters</Button>
            )}
          </div>
        ) : (
          filteredQueue.map((entry) => <PatientCard entry={entry} key={entry.patient.id} />)
        )}
      </div>
    </div>
  );
}

function PatientCard({ entry }: { entry: any }) {
  const isCritical = entry.urgency === 'critical';
  const isMonitor = entry.urgency === 'monitor';
  const borderColor = isCritical ? 'border-l-red-600' : isMonitor ? 'border-l-amber-500' : 'border-l-emerald-500';

  return (
    <Card className={`border-l-4 ${borderColor} shadow-sm`} data-testid={`card-patient-${entry.patient.id}`}>
      <CardContent className="p-0 flex flex-col sm:flex-row">
        <div className="flex-1 p-5 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="text-xl font-bold">{entry.patient.name}</h3>
              <div className="text-muted-foreground text-sm mt-1">
                {entry.patient.ageYears ? `${entry.patient.ageYears} yrs` : entry.patient.ageMonths ? `${entry.patient.ageMonths} mos` : '—'} &middot; {entry.patient.weightKg ? `${entry.patient.weightKg}kg` : 'No weight'} &middot; {entry.patient.location}
              </div>
            </div>
            {isCritical && <Badge className="bg-red-600 hover:bg-red-600 text-white uppercase tracking-wide shrink-0">Critical</Badge>}
            {isMonitor && <Badge className="bg-amber-500 hover:bg-amber-500 text-white uppercase tracking-wide shrink-0">Monitor</Badge>}
            {!isCritical && !isMonitor && <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white uppercase tracking-wide shrink-0">Low Risk</Badge>}
          </div>
          {entry.topMatch && (
            <div className="bg-muted rounded-md p-3 flex items-center justify-between">
              <span className="font-semibold text-primary">{entry.topMatch.disease} — {entry.topMatch.confidencePercent}%</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(entry.latestAssessment.createdAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
        <div className="sm:w-40 bg-muted/30 border-t sm:border-t-0 sm:border-l p-4 flex flex-row sm:flex-col gap-2 justify-center">
          <Button size="sm" className="w-full" asChild data-testid={`button-view-patient-${entry.patient.id}`}>
            <Link href={`/patient/${entry.patient.id}`}>View Patient <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
          {entry.topMatch?.protocolId && (
            <Button size="sm" variant="outline" className="w-full" asChild data-testid={`button-protocol-${entry.patient.id}`}>
              <Link href={`/protocol/${entry.topMatch.protocolId}`}>Protocol</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
