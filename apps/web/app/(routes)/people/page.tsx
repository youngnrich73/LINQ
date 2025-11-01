"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { PersonGroup } from "../../state/types";

const GROUPS: (PersonGroup | "All")[] = ["All", "Inner", "Close", "Work"];
const TARGETS = [0.5, 1, 1.5, 2];

export default function PeoplePage() {
  const { people, metrics, addPerson, updatePerson } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");
  const [name, setName] = useState("");
  const [newGroup, setNewGroup] = useState<PersonGroup>("Inner");
  const [target, setTarget] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState<PersonGroup>("Inner");
  const [editTarget, setEditTarget] = useState<number>(1);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setEditName("");
      setEditGroup("Inner");
      setEditTarget(1);
      setEditError(null);
      return;
    }
    const person = people.find((item) => item.id === editingId);
    if (!person) {
      setEditingId(null);
      return;
    }
    setEditName(person.name);
    setEditGroup(person.group);
    setEditTarget(person.targetPerWeek);
    setEditError(null);
  }, [editingId, people]);


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

  const handleAdd = async () => {
    if (!name.trim()) {
      setFormError("Enter a name to add someone to your radar.");
      return;
    }
    if (people.length >= 12) {
      setFormError("You can favorite up to 12 people for now.");
      return;
    }
    setSubmitting(true);
    try {
      await addPerson({ name: name.trim(), group: newGroup, targetPerWeek: target });
      setName("");
      setFormError(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      setEditError("Name cannot be empty.");
      return;
    }
    setSavingEdit(true);
    try {
      await updatePerson(editingId, {
        name: editName.trim(),
        group: editGroup,
        targetPerWeek: editTarget,
      });
      setEditError(null);
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage focus list</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add or edit the people you want to keep warm. Updates immediately affect radar scoring and routines.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-sm">
              <span className="font-medium">Name</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                placeholder="Ada Lovelace"
                aria-label="Person name"
                disabled={people.length >= 12}
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">Relationship lane</span>
              <select
                value={newGroup}
                onChange={(event) => {
                  setNewGroup(event.target.value as PersonGroup);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="Relationship lane"
                disabled={people.length >= 12}
              >
                {GROUPS.filter((option): option is PersonGroup => option !== "All").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">Target touches / week</span>
              <select
                value={target}
                onChange={(event) => {
                  setTarget(Number(event.target.value));
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="Target touches per week"
                disabled={people.length >= 12}
              >
                {TARGETS.map((option) => (
                  <option key={option} value={option}>
                    {option.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{people.length} / 12 favorites</p>
            <Button onClick={() => void handleAdd()} disabled={submitting || people.length >= 12}>
              {submitting ? "Adding…" : "Add person"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <th className="px-3 py-2">Actions</th>
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
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingId(person.id);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/people/${person.id}`);
                            }}
                          >
                            Open dossier
                          </Button>
                        </div>
                      </td>
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

      {editingId ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit person</CardTitle>
            <p className="text-sm text-muted-foreground">Adjust the relationship lane or cadence for this contact.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col text-sm">
                <span className="font-medium">Name</span>
                <input
                  value={editName}
                  onChange={(event) => {
                    setEditName(event.target.value);
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="Edit name"
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="font-medium">Relationship lane</span>
                <select
                  value={editGroup}
                  onChange={(event) => {
                    setEditGroup(event.target.value as PersonGroup);
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="Edit relationship lane"
                >
                  {GROUPS.filter((option): option is PersonGroup => option !== "All").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="font-medium">Target touches / week</span>
                <select
                  value={editTarget}
                  onChange={(event) => {
                    setEditTarget(Number(event.target.value));
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="Edit target touches per week"
                >
                  {TARGETS.map((option) => (
                    <option key={option} value={option}>
                      {option.toFixed(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button onClick={() => void handleEdit()} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
