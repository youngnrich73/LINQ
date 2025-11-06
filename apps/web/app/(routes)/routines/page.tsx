"use client";

import { useMemo, useState } from "react";
import { formatDisplay } from "../../lib/date";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { RoutineRule } from "../../state/types";

const RULE_TYPE_LABELS: Record<RoutineRule["type"], string> = {
  weekly: "주간",
  monthly: "월간",
  custom: "맞춤",
};

export default function RoutinesPage() {
  const { people, addRoutine, routines, touches, settings, toggleNotifications } = useData();
  const [personId, setPersonId] = useState<string>("all");
  const [ruleType, setRuleType] = useState<RoutineRule["type"]>("weekly");
  const [count, setCount] = useState<number>(1);
  const [note, setNote] = useState("");

  const personOptions = useMemo(() => [{ id: "all", name: "전체" }, ...people], [people]);
  const personName = (id: string | undefined) => people.find((person) => person.id === id)?.name ?? "전체";
  const hasPeople = people.length > 0;

  const relatedTouches = useMemo(() => {
    return routines.map((routine) => ({
      routine,
      touches: touches.filter((touch) => touch.routineId === routine.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
  }, [routines, touches]);

  const handleCreate = async () => {
    if (!hasPeople) return;
    const rule: RoutineRule = { type: ruleType, count: Math.max(1, count) };
    await addRoutine({ personId: personId === "all" ? undefined : personId, rule, note });
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>루틴 만들기</CardTitle>
          <p className="text-sm text-muted-foreground">소중한 사람들을 위해 4주치 접점을 미리 계획하세요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm">
              <span className="font-medium">사람</span>
              <select
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                disabled={!hasPeople}
              >
                {personOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">빈도</span>
              <select
                value={ruleType}
                onChange={(event) => setRuleType(event.target.value as RoutineRule["type"])}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                disabled={!hasPeople}
              >
                <option value="weekly">주간</option>
                <option value="monthly">월간</option>
                <option value="custom">맞춤(일)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">횟수</span>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                disabled={!hasPeople}
              />
            </label>
            <label className="text-sm">
              <span className="font-medium">메모</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="예: 커피챗, 감사 메시지"
                disabled={!hasPeople}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void handleCreate()} disabled={!hasPeople}>
              접점 생성
            </Button>
            {!hasPeople ? (
              <p className="text-xs text-muted-foreground">People 페이지에서 사람을 추가하면 루틴을 설정할 수 있어요.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <p className="text-sm text-muted-foreground">D-1 알림을 받으려면 브라우저 알림을 켜세요.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            variant={settings.notificationsEnabled ? "secondary" : "outline"}
            onClick={() => void toggleNotifications(!settings.notificationsEnabled)}
            disabled={!hasPeople}
          >
            {settings.notificationsEnabled ? "알림 끄기" : "알림 켜기"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {!hasPeople
              ? "사람을 최소 한 명 추가하면 알림을 켤 수 있어요."
              : settings.notificationsEnabled
                ? "예약된 접점 하루 전에 알려드려요."
                : "알림은 이 기기에서만 동작하며 언제든지 바꿀 수 있어요."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>생성된 루틴</CardTitle>
          <p className="text-sm text-muted-foreground">중복을 제거한 앞으로 4주간의 접점이에요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {relatedTouches.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 루틴이 없어요. 위에서 새로 만들어 보세요.</p>
          ) : (
            relatedTouches.map(({ routine, touches }) => (
              <section key={routine.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{personName(routine.personId)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {RULE_TYPE_LABELS[routine.rule.type]} · {routine.rule.count} {routine.rule.type === "custom" ? "일 간격" : "회/주기"}
                    </p>
                  </div>
                  {routine.note ? <span className="text-sm text-muted-foreground">{routine.note}</span> : null}
                </header>
                <ul className="mt-3 space-y-2 text-sm">
                  {touches.length === 0 ? (
                    <li className="text-muted-foreground">예정된 접점이 없습니다.</li>
                  ) : (
                    touches.map((touch) => (
                      <li key={touch.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 px-3 py-2">
                        <span>{formatDisplay(new Date(touch.date), "PPPP")}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {touch.acknowledged ? "확인 완료" : "예정"}
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
