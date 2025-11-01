"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { PersonGroup } from "../../state/types";

const GROUPS: (PersonGroup | "All")[] = ["All", "Inner", "Close", "Work"];

export default function PeoplePage() {
  const { people, metrics } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");

  const filtered = useMemo(() => {
    return people.filter((person) => {
      const matchesQuery = person.name.toLowerCase().includes(query.toLowerCase());
      const matchesGroup = group === "All" || person.group === group;
      return matchesQuery && matchesGroup;
    });
  }, [group, people, query]);

  const metricsByPerson = useMemo(() => {
    return new Map(metrics.map((metric) => [metric.personId, metric]));
  }, [metrics]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search, filter, and drill into a relationship dossier.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Search by name"
              aria-label="Search people"
            />
            <div className="flex items-center gap-2">
              {GROUPS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={group === option ? "secondary" : "outline"}
                  onClick={() => setGroup(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Recency</th>
                  <th className="px-3 py-2">Next touch</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => {
                  const metric = metricsByPerson.get(person.id);
                  return (
                    <tr
                      key={person.id}
                      className="cursor-pointer border-b border-border/60 transition hover:bg-muted/40"
                      onClick={() => router.push(`/people/${person.id}`)}
                    >
                      <td className="px-3 py-3 font-medium">{person.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{person.group}</td>
                      <td className="px-3 py-3">{metric?.totalScore ?? "—"}</td>
                      <td className="px-3 py-3">{metric?.lastInteractionSummary ?? "No log"}</td>
                      <td className="px-3 py-3">{metric?.nextRecommendedTouch ?? "—"}</td>
                      <td className="px-3 py-3">{metric?.statusLabel ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">No people match your filters yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
