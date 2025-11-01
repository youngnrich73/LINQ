"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { RelationshipRadar } from "../../components/relationship-radar";
import { TopSuggestions } from "../../components/top-suggestions";
import { UpcomingTouches } from "../../components/upcoming-touches";
import { useData } from "../../state/data-context";

export default function OverviewPage() {
  const { people, metrics, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading your dashboard…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gathering relationship telemetry.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = metrics.reduce(
    (acc, metric) => {
      acc.score += metric.totalScore;
      acc.count += 1;
      acc.warm += metric.statusLabel === "Warm" ? 1 : 0;
      return acc;
    },
    { score: 0, count: 0, warm: 0 }
  );

  const averageScore = summary.count > 0 ? Math.round(summary.score / summary.count) : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average score</CardTitle>
            <p className="text-sm text-muted-foreground">Relationship composite across the radar.</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{averageScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Warm connections</CardTitle>
            <p className="text-sm text-muted-foreground">Count of contacts scoring ≥ 75.</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.warm}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last recalculated</CardTitle>
            <p className="text-sm text-muted-foreground">Runs when idle or when you return to the tab.</p>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{format(new Date(), "PPpp")}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Relationship radar</CardTitle>
          <p className="text-sm text-muted-foreground">Distance = recency, color = valence, dot size = frequency. Click a point for the dossier.</p>
        </CardHeader>
        <CardContent>
          <RelationshipRadar people={people} metrics={metrics} />
        </CardContent>
      </Card>

      <TopSuggestions />
      <UpcomingTouches />
    </div>
  );
}
