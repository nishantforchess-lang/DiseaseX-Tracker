import { useState } from "react";
import { Link } from "wouter";
import { useListProtocols, getListProtocolsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, BookOpen } from "lucide-react";

const severityColors: Record<string, string> = {
  mild: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  severe: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function Protocols() {
  const [search, setSearch] = useState("");

  const { data: protocols, isLoading } = useListProtocols({ search: search || undefined }, {
    query: { queryKey: getListProtocolsQueryKey({ search: search || undefined }) }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-7 w-7 text-primary" /> Protocol Library</h1>
        <p className="text-muted-foreground text-sm">WHO and local treatment guidelines. Available offline.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search protocols by disease or title..."
          className="pl-10 h-12"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-protocols"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
        ) : !protocols || protocols.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
            <BookOpen className="h-12 w-12 opacity-20 mx-auto mb-3" />
            <p className="font-medium">No protocols found</p>
            {search && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          protocols.map(protocol => (
            <Link key={protocol.id} href={`/protocol/${protocol.id}`} data-testid={`link-protocol-${protocol.id}`}>
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={severityColors[protocol.severity] || "bg-muted"}>
                        {protocol.severity.toUpperCase()}
                      </Badge>
                      {protocol.whoBased && <Badge variant="outline" className="text-xs">WHO</Badge>}
                    </div>
                    <div className="font-bold">{protocol.disease}</div>
                    <div className="text-sm text-muted-foreground">{protocol.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">Drugs: {protocol.drugs.join(", ")}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
