"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../state/data-context";
import type { Suggestion } from "../state/types";

export function TopSuggestions() {
  const { suggestions, logInteraction, people } = useData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top nudges</CardTitle>
          <p className="text-sm text-muted-foreground">As you log interactions, suggestions will appear here.</p>
        </CardHeader>
      </Card>
    );
  }

  const handleQuickAction = async (suggestion: Suggestion, action: "copy" | "memo" | "routine") => {
    if (action === "copy") {
      await navigator.clipboard.writeText(suggestion.template);
    } else if (action === "memo") {
      await logInteraction(suggestion.personId, {
        type: "note",
        date: new Date().toISOString(),
        note: suggestion.template,
        sentiment: suggestion.metrics.valenceScore / 100,
        createdVia: "quick-action",
      });
    } else {
      const person = people.find((item) => item.id === suggestion.personId);
      if (person) {
        await logInteraction(suggestion.personId, {
          type: "check-in",
          date: new Date().toISOString(),
          note: `Scheduled follow-up for ${person.name}`,
          createdVia: "quick-action",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 suggestions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ranked by relationship heat. Toggle explain to see the why behind each recommendation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <article key={suggestion.personId} className="rounded-lg border border-border bg-card/40 p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold">{suggestion.headline}</h3>
                <p className="text-sm text-muted-foreground">Next touch by {suggestion.metrics.nextRecommendedTouch}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [suggestion.personId]: !prev[suggestion.personId] }))
                  }
                >
                  {expanded[suggestion.personId] ? "Hide explain" : "Explain"}
                </Button>
              </div>
            </header>
            <p className="mt-3 text-sm">{suggestion.template}</p>
            {expanded[suggestion.personId] ? (
              <p className="mt-2 text-xs text-muted-foreground">{suggestion.explanation}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "copy")}>Copy text</Button>
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "memo")}>Save memo</Button>
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "routine")}>Log routine</Button>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
