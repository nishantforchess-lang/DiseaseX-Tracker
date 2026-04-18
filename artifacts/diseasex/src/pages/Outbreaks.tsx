import { useState } from "react";
import { useListOutbreakAlerts, useCreateOutbreakAlert, getListOutbreakAlertsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin, Plus, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  active: "bg-red-600 text-white",
  monitoring: "bg-amber-500 text-white",
  resolved: "bg-emerald-600 text-white",
};

export default function Outbreaks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assessmentId: "", location: "", latitude: "", longitude: "", symptomsSummary: "" });

  const { data: outbreaks, isLoading } = useListOutbreakAlerts({
    query: { queryKey: getListOutbreakAlertsQueryKey() }
  });

  const createOutbreak = useCreateOutbreakAlert();

  const handleSubmit = () => {
    if (!form.assessmentId || !form.location || !form.symptomsSummary) {
      toast({ title: "Fill in required fields", variant: "destructive" });
      return;
    }
    createOutbreak.mutate({
      data: {
        assessmentId: parseInt(form.assessmentId),
        location: form.location,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        symptomsSummary: form.symptomsSummary,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutbreakAlertsQueryKey() });
        toast({ title: "Outbreak alert reported", description: "District health officials will be notified" });
        setShowForm(false);
        setForm({ assessmentId: "", location: "", latitude: "", longitude: "", symptomsSummary: "" });
      },
      onError: () => {
        toast({ title: "Failed to report alert", variant: "destructive" });
      }
    });
  };

  const sortedOutbreaks = outbreaks?.slice().sort((a, b) => {
    const order = { active: 0, monitoring: 1, resolved: 2 };
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-7 w-7 text-red-600" /> Outbreak Alerts</h1>
          <p className="text-muted-foreground text-sm">Atypical cases flagged to district health officials</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-report-alert">
          <Plus className="h-4 w-4 mr-1" /> Report Alert
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-red-200">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base text-red-700">Report Atypical Case</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} data-testid="button-close-form"><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label htmlFor="aId">Assessment ID *</Label>
              <Input id="aId" type="number" className="mt-1 h-12" placeholder="From the patient's assessment" value={form.assessmentId} onChange={e => setForm(f => ({ ...f, assessmentId: e.target.value }))} data-testid="input-assessment-id" />
            </div>
            <div>
              <Label htmlFor="loc">Location *</Label>
              <Input id="loc" className="mt-1 h-12" placeholder="Village, district, or region" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} data-testid="input-location" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lat">GPS Latitude</Label>
                <Input id="lat" type="number" step="any" className="mt-1 h-12" placeholder="e.g. 10.3742" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} data-testid="input-latitude" />
              </div>
              <div>
                <Label htmlFor="lon">GPS Longitude</Label>
                <Input id="lon" type="number" step="any" className="mt-1 h-12" placeholder="e.g. -12.0779" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} data-testid="input-longitude" />
              </div>
            </div>
            <div>
              <Label htmlFor="summary">Symptom Summary *</Label>
              <textarea id="summary" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="Describe the atypical presentation..." value={form.symptomsSummary} onChange={e => setForm(f => ({ ...f, symptomsSummary: e.target.value }))} data-testid="input-summary" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={createOutbreak.isPending} data-testid="button-submit-alert">
                {createOutbreak.isPending ? "Reporting..." : "Report to District Officials"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts list */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
        ) : !sortedOutbreaks || sortedOutbreaks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
            <AlertTriangle className="h-12 w-12 opacity-20 mx-auto mb-3" />
            <p className="font-medium">No outbreak alerts</p>
            <p className="text-sm mt-1">No atypical cases have been reported in this region.</p>
          </div>
        ) : (
          sortedOutbreaks.map(alert => (
            <Card key={alert.id} className={`border-l-4 ${alert.status === 'active' ? 'border-l-red-600' : alert.status === 'monitoring' ? 'border-l-amber-500' : 'border-l-emerald-500'}`} data-testid={`card-alert-${alert.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    {alert.location}
                  </div>
                  <Badge className={statusColors[alert.status] || "bg-muted"}>{alert.status.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.symptomsSummary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Reported {formatDistanceToNow(new Date(alert.reportedAt), { addSuffix: true })}</span>
                  {alert.latitude && alert.longitude && (
                    <span className="font-mono">{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
