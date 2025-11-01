"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { RoutineRule } from "../../state/types";

export default function RoutinesPage() {
  const { people, addRoutine, routines, touches, settings, toggleNotifications } = useData();
  const [personId, setPersonId] = useState<string>("all");
  const [ruleType, setRuleType] = useState<RoutineRule["type"]>("weekly");
  const [count, setCount] = useState<number>(1);
  const [note, setNote] = useState("");

  const personOptions = useMemo(() => [{ id: "all", name: "Any" }, ...people], [people]);
  const personName = (id: string | undefined) => people.find((person) => person.id === id)?.name ?? "Any";

  const relatedTouches = useMemo(() => {
    return routines.map((routine) => ({
      routine,
      touches: touches.filter((touch) => touch.routineId === routine.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
  }, [routines, touches]);

  const handleCreate = async () => {
    const rule: RoutineRule = { type: ruleType, count: Math.max(1, count) };
    await addRoutine({ personId: personId === "all" ? undefined : personId, rule, note });
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a routine</CardTitle>
          <p className="text-sm text-muted-foreground">Generate four weeks of planned touches for the people who matter.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm">
              <span className="font-medium">Person</span>
              <select
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {personOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">Cadence</span>
              <select
                value={ruleType}
                onChange={(event) => setRuleType(event.target.value as RoutineRule["type"])}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom (days)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">Count</span>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium">Note</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Coffee chat, gratitude note, etc."
              />
            </label>
          </div>
          <Button onClick={() => void handleCreate()}>Generate touches</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <p className="text-sm text-muted-foreground">Enable browser notifications for D-1 reminders.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            variant={settings.notificationsEnabled ? "secondary" : "outline"}
            onClick={() => void toggleNotifications(!settings.notificationsEnabled)}
          >
            {settings.notificationsEnabled ? "Disable" : "Enable"} notifications
          </Button>
          <p className="text-xs text-muted-foreground">
            {settings.notificationsEnabled
              ? "We’ll ping you one day before a scheduled touch."
              : "Notifications stay on-device and can be toggled any time."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated routines</CardTitle>
          <p className="text-sm text-muted-foreground">Next four weeks of touches with duplicates removed.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {relatedTouches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No routines yet. Create one above to populate the list.</p>
          ) : (
            relatedTouches.map(({ routine, touches }) => (
              <section key={routine.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{personName(routine.personId)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {routine.rule.type} · {routine.rule.count} {routine.rule.type === "custom" ? "days" : "per period"}
                    </p>
                  </div>
                  {routine.note ? <span className="text-sm text-muted-foreground">{routine.note}</span> : null}
                </header>
                <ul className="mt-3 space-y-2 text-sm">
                  {touches.length === 0 ? (
                    <li className="text-muted-foreground">No upcoming touches inside the horizon.</li>
                  ) : (
                    touches.map((touch) => (
                      <li key={touch.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                        <span>{format(new Date(touch.date), "PPPP")}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {touch.acknowledged ? "Ready" : "Pending"}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
