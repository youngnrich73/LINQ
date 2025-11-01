"use client";

import { format } from "date-fns";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../state/data-context";

export function UpcomingTouches() {
  const { touches, acknowledgeTouch, people } = useData();
  const sorted = [...touches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextFourWeeks = sorted.filter((touch) => new Date(touch.date).getTime() >= Date.now());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled touches</CardTitle>
        <p className="text-sm text-muted-foreground">
          Auto-generated from your routines. We send a D-1 notification when enabled.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {nextFourWeeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming touches yet—add a routine to generate them.</p>
        ) : (
          <ul className="space-y-3">
            {nextFourWeeks.map((touch) => {
              const person = people.find((item) => item.id === touch.personId);
              return (
                <li key={touch.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{person ? person.name : "General"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(touch.date), "PPPP")}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={touch.acknowledged ? "secondary" : "outline"}
                    onClick={() => void acknowledgeTouch(touch.id)}
                  >
                    {touch.acknowledged ? "Noted" : "Done"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
