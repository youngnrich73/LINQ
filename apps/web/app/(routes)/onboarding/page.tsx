"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { PersonGroup } from "../../state/types";

const GROUPS: PersonGroup[] = ["Inner", "Close", "Work"];
const TARGETS = [0.5, 1, 1.5, 2];

export default function OnboardingPage() {
  const { addPerson, people, markOnboardingDone, loading } = useData();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<PersonGroup>("Inner");
  const [target, setTarget] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("Add a name to continue.");
      return;
    }
    if (people.length >= 12) {
      setError("You can favorite up to 12 people for now.");
      return;
    }
    setError(null);
    await addPerson({ name: name.trim(), group, targetPerWeek: target });
    setName("");
  };

  const canComplete = people.length >= 12;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl">Let’s set up your relationship radar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add up to 12 VIPs you want to stay close to. We’ll track healthy cadence and recommend next steps.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-sm">
              <span className="font-medium">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                placeholder="Ada Lovelace"
                aria-label="Name"
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">Relationship lane</span>
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value as PersonGroup)}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="Relationship lane"
              >
                {GROUPS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">Target touches per week</span>
              <select
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="Target touches per week"
              >
                {TARGETS.map((option) => (
                  <option key={option} value={option}>
                    {option.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {people.length} / 12 favorites added
            </p>
            <Button onClick={handleAdd} disabled={loading || people.length >= 12}>
              Add person
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your focus list</CardTitle>
          <p className="text-sm text-muted-foreground">
            We’ll use these profiles to compute recency, valence, and routines.
          </p>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorites yet. Add at least twelve to continue.</p>
          ) : (
            <ol className="grid gap-4 md:grid-cols-2">
              {people.map((person, index) => (
                <li key={person.id} className="rounded-lg border border-border bg-card/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{person.group}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">Target: {person.targetPerWeek.toFixed(1)} / week</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Added #{index + 1}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <p className="text-sm text-muted-foreground">Complete onboarding to unlock the overview and radar.</p>
        <Button onClick={() => void markOnboardingDone()} disabled={!canComplete}>
          Start tracking
        </Button>
      </div>
    </div>
  );
}
