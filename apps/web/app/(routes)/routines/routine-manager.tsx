"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@linq/ui";

import {
  createEmptyRoutine,
  createScheduleEntries,
  loadRoutines,
  loadSchedule,
  markRoutineComplete,
  removeRoutine,
  saveRoutine,
  upsertScheduleItems,
} from "../../lib/routines-store";
import type { Routine } from "../../lib/types";

import { GoogleCalendarPreview } from "./google-calendar-preview";

interface RoutineEditorProps {
  routine: Routine;
  onChange: (routine: Routine) => void;
  onSave: (routine: Routine) => Promise<void>;
  onDelete: (routineId: string) => Promise<void>;
}

const RoutineEditor = ({ routine, onChange, onSave, onDelete }: RoutineEditorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{routine.name || "새 루틴"}</CardTitle>
        <CardDescription>루틴 정보를 수정하고 로컬에 저장하세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            이름
            <input
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={routine.name}
              onChange={(event) => onChange({ ...routine, name: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium">
            주기
            <select
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={routine.cadence}
              onChange={(event) => onChange({ ...routine, cadence: event.target.value as Routine["cadence"] })}
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="biweekly">격주</option>
              <option value="monthly">매월</option>
            </select>
          </label>
        </div>
        <label className="text-sm font-medium">
          선호 요일
          <select
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            value={routine.preferredDay ?? 1}
            onChange={(event) => onChange({ ...routine, preferredDay: Number(event.target.value) })}
          >
            <option value={0}>일요일</option>
            <option value={1}>월요일</option>
            <option value={2}>화요일</option>
            <option value={3}>수요일</option>
            <option value={4}>목요일</option>
            <option value={5}>금요일</option>
            <option value={6}>토요일</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          메모
          <textarea
            className="mt-1 h-24 w-full rounded-md border border-border px-3 py-2"
            value={routine.notes ?? ""}
            onChange={(event) => onChange({ ...routine, notes: event.target.value })}
          />
        </label>
        <div className="flex gap-3">
          <Button type="button" onClick={() => onSave(routine)}>
            저장
          </Button>
          <Button type="button" variant="outline" onClick={() => onDelete(routine.id)}>
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const RoutineManager = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<{ id: string; routineId: string; scheduledAt: string; completed: boolean }[]>([]);

  useEffect(() => {
    loadRoutines().then((loaded) => {
      setRoutines(loaded);
      setSelectedId((prev) => prev ?? loaded[0]?.id ?? null);
    });
    loadSchedule().then(setSchedule);
  }, []);

  const selectedRoutine = useMemo(() => routines.find((routine) => routine.id === selectedId), [routines, selectedId]);

  const handleCreate = async () => {
    const routine = createEmptyRoutine();
    setRoutines((prev) => [...prev, routine]);
    setSelectedId(routine.id);
  };

  const handleSave = async (routine: Routine) => {
    const next = await saveRoutine(routine);
    setRoutines(next);
    const newEntries = createScheduleEntries(routine, 6);
    const other = schedule.filter((item) => item.routineId !== routine.id);
    const combined = [...other, ...newEntries];
    setSchedule(combined);
    await upsertScheduleItems(combined);
  };

  const handleDelete = async (routineId: string) => {
    const next = await removeRoutine(routineId);
    setRoutines(next);
    const refreshedSchedule = await loadSchedule();
    setSchedule(refreshedSchedule);
    setSelectedId((prev) => (prev === routineId ? next[0]?.id ?? null : prev));
  };

  const handleComplete = async (occurrenceId: string, routineId: string) => {
    const result = await markRoutineComplete(routineId, occurrenceId);
    setRoutines(result.routines);
    setSchedule(result.schedule);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>루틴 목록</CardTitle>
          <CardDescription>로컬에 저장되어 기기에만 유지됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={handleCreate} className="w-full">
            루틴 추가
          </Button>
          <ul className="space-y-2">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(routine.id)}
                  className={cn(
                    "w-full rounded-md border border-border px-3 py-2 text-left text-sm",
                    selectedId === routine.id ? "bg-primary/10" : "bg-background",
                  )}
                >
                  <div className="font-medium">{routine.name || "이름 없음"}</div>
                  <div className="text-xs text-muted-foreground">
                    {routine.cadence} · 마지막 완료 {routine.lastCompletedAt ? new Date(routine.lastCompletedAt).toLocaleDateString() : "없음"}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="space-y-6">
        {selectedRoutine ? (
          <RoutineEditor routine={selectedRoutine} onChange={(next) => setRoutines((prev) => prev.map((entry) => (entry.id === next.id ? next : entry)))} onSave={handleSave} onDelete={handleDelete} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>루틴을 선택하세요</CardTitle>
            </CardHeader>
            <CardContent>왼쪽에서 루틴을 선택하거나 새로 추가하세요.</CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>예정된 일정</CardTitle>
            <CardDescription>루틴 기반으로 생성된 향후 터치 일정입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.length === 0 && <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>}
            {schedule.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(item.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {routines.find((routine) => routine.id === item.routineId)?.name ?? "루틴"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={item.completed ? "secondary" : "outline"}
                  onClick={() => handleComplete(item.id, item.routineId)}
                >
                  {item.completed ? "완료됨" : "완료"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <GoogleCalendarPreview />
      </div>
    </div>
  );
};
