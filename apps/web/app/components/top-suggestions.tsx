"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../state/data-context";
import type { Suggestion } from "../state/types";

export function TopSuggestions() {
  const { suggestions, logInteraction, people } = useData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (people.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 행동</CardTitle>
          <p className="text-sm text-muted-foreground">
            People 페이지에서 사람을 추가하면 관계에 맞춘 추천을 받을 수 있어요.
          </p>
        </CardHeader>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 행동</CardTitle>
          <p className="text-sm text-muted-foreground">상호작용을 기록하면 추천이 여기 나타나요.</p>
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
        <CardTitle>추천 행동</CardTitle>
        <p className="text-sm text-muted-foreground">
          관계 온도를 기준으로 정렬했어요. 이유 보기를 누르면 추천 배경을 확인할 수 있어요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <article key={suggestion.personId} className="rounded-lg border border-border bg-card/40 p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold">{suggestion.headline}</h3>
                <p className="text-sm text-muted-foreground">다음 접점: {suggestion.metrics.nextRecommendedTouch}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [suggestion.personId]: !prev[suggestion.personId] }))
                  }
                >
                  {expanded[suggestion.personId] ? "이유 숨기기" : "이유 보기"}
                </Button>
              </div>
            </header>
            <p className="mt-3 text-sm">{suggestion.template}</p>
            {expanded[suggestion.personId] ? (
              <p className="mt-2 text-xs text-muted-foreground">{suggestion.explanation}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "copy")}>문구 복사</Button>
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "memo")}>메모 저장</Button>
              <Button variant="outline" size="sm" onClick={() => void handleQuickAction(suggestion, "routine")}>루틴 기록</Button>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
