"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { formatDisplay } from "../lib/date";
import { useData } from "../state/data-context";

export function UpcomingTouches() {
  const { touches, acknowledgeTouch, people } = useData();
  const sorted = [...touches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextFourWeeks = sorted.filter((touch) => new Date(touch.date).getTime() >= Date.now());

  return (
    <Card>
      <CardHeader>
        <CardTitle>예정된 접점</CardTitle>
        <p className="text-sm text-muted-foreground">
          루틴에서 자동으로 만들어집니다. 알림을 켜면 하루 전에 알려드려요.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {nextFourWeeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">예정된 접점이 없어요. 루틴을 추가해 만들어 보세요.</p>
        ) : (
          <ul className="space-y-3">
            {nextFourWeeks.map((touch) => {
              const person = people.find((item) => item.id === touch.personId);
              return (
                <li key={touch.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{person ? person.name : "공통"}</p>
                    <p className="text-xs text-muted-foreground">{formatDisplay(new Date(touch.date), "PPPP")}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={touch.acknowledged ? "secondary" : "outline"}
                    onClick={() => void acknowledgeTouch(touch.id)}
                  >
                    {touch.acknowledged ? "확인 완료" : "완료"}
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
