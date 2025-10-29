"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linq/ui";

import { generateFirstWeekSuggestions } from "../actions/generate-suggestions";
import { createEmptyRoutine, createScheduleEntries, saveRoutine, upsertScheduleItems } from "../lib/routines-store";
import type { OnboardingPayload, Person, Routine } from "../lib/types";

const RECOMMENDED_PEOPLE = [
  "Alex Kim",
  "Dana Lee",
  "Chris Park",
  "Morgan Choi",
  "Jamie Han",
  "Taylor Song",
  "Jordan Yu",
  "Robin Seo",
  "Riley Ahn",
  "Casey Koo",
  "Sage Ryu",
  "Sky Im",
  "Jules Min",
  "Harper Cho",
  "Peyton Jang",
];

interface PersonFormState {
  name: string;
  recencyDays: number;
  emotion: number;
  frequencyPerWeek: number;
}

const toPerson = (form: PersonFormState): Person => ({
  id: `${form.name}-${form.recencyDays}-${form.emotion}`,
  name: form.name,
  recencyDays: form.recencyDays,
  emotion: form.emotion,
  frequencyPerWeek: form.frequencyPerWeek,
});

export const OnboardingFlow = () => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Person[]>([]);
  const [personForm, setPersonForm] = useState<PersonFormState>({
    name: "",
    recencyDays: 14,
    emotion: 0,
    frequencyPerWeek: 1,
  });
  const [weeklyTouches, setWeeklyTouches] = useState(6);
  const [routine, setRoutine] = useState<Routine>(() => ({
    ...createEmptyRoutine(),
    name: "주간 체크인",
    preferredDay: 1,
  }));
  const [coupleMode, setCoupleMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("linq-selected-people", JSON.stringify(selected));
    }
  }, [selected]);

  const filteredPeople = useMemo(() => {
    const lower = query.toLowerCase();
    return RECOMMENDED_PEOPLE.filter((name) => name.toLowerCase().includes(lower));
  }, [query]);

  const canProceedStep1 = selected.length === 12;
  const canProceedStep2 = weeklyTouches > 0;

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const addPerson = (person: Person) => {
    setSelected((prev) => {
      if (prev.find((entry) => entry.name === person.name)) {
        return prev;
      }
      const next = [...prev, person];
      return next.slice(0, 12);
    });
  };

  const handleManualAdd = () => {
    if (!personForm.name.trim()) {
      return;
    }
    addPerson(toPerson(personForm));
    setPersonForm({
      name: "",
      recencyDays: 14,
      emotion: 0,
      frequencyPerWeek: 1,
    });
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      return;
    }
    const payload: OnboardingPayload & { coupleMode: boolean } = {
      selectedPeople: selected,
      weeklyGoal: { touchesPerWeek: weeklyTouches },
      routine,
      coupleMode,
    };

    startTransition(async () => {
      await saveRoutine(routine);
      const schedule = createScheduleEntries(routine, 4);
      await upsertScheduleItems(schedule);
      await generateFirstWeekSuggestions(payload);
      router.push("/");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
        <span>남은 시간</span>
        <span className="font-mono text-lg">{minutes}:{seconds}</span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>① 최우선 12인 선택</CardTitle>
            <CardDescription>검색하거나 직접 입력해 최대 12명까지 추가하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="people-search">
                이름 검색
              </label>
              <input
                id="people-search"
                className="w-full rounded-md border border-border px-3 py-2"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름을 입력하세요"
              />
              <div className="flex flex-wrap gap-2" aria-live="polite">
                {filteredPeople.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      addPerson({
                        id: name,
                        name,
                        recencyDays: 14,
                        frequencyPerWeek: 1,
                        emotion: 0,
                      })
                    }
                    className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">이름 추가</label>
                <input
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={personForm.name}
                  onChange={(event) => setPersonForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="이름"
                />
              </div>
              <div>
                <label className="text-sm font-medium">최근 연결(일)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={personForm.recencyDays}
                  onChange={(event) =>
                    setPersonForm((prev) => ({ ...prev, recencyDays: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">감정 (-1~1)</label>
                <input
                  type="number"
                  min={-1}
                  max={1}
                  step={0.1}
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={personForm.emotion}
                  onChange={(event) =>
                    setPersonForm((prev) => ({ ...prev, emotion: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">주간 빈도</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={personForm.frequencyPerWeek}
                  onChange={(event) =>
                    setPersonForm((prev) => ({ ...prev, frequencyPerWeek: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
            <Button type="button" onClick={handleManualAdd} disabled={selected.length >= 12}>
              추가하기
            </Button>
            <div className="space-y-2">
              <p className="text-sm font-medium">선택된 사람 ({selected.length}/12)</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {selected.map((person) => (
                  <li key={person.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      {person.name}
                      <button
                        type="button"
                        onClick={() => setSelected((prev) => prev.filter((entry) => entry.id !== person.id))}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        제거
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최근 {person.recencyDays}일 / 감정 {person.emotion} / 빈도 {person.frequencyPerWeek}/주
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)} disabled={!canProceedStep1}>
                다음 단계
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>② 주당 목표 빈도 설정</CardTitle>
            <CardDescription>현실적으로 유지 가능한 주간 목표를 정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="weekly-target">
                주당 터치 횟수: {weeklyTouches}회
              </label>
              <input
                id="weekly-target"
                type="range"
                min={1}
                max={21}
                value={weeklyTouches}
                onChange={(event) => setWeeklyTouches(Number(event.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">12명의 우선 인물과 고르게 연결되도록 목표를 조정하세요.</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setStep(1)}>
                이전 단계
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!canProceedStep2}>
                다음 단계
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>③ 루틴 생성</CardTitle>
            <CardDescription>첫 루틴을 등록하고 커플 모드를 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="routine-name">
                  루틴 이름
                </label>
                <input
                  id="routine-name"
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={routine.name}
                  onChange={(event) => setRoutine((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="routine-cadence">
                  주기
                </label>
                <select
                  id="routine-cadence"
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={routine.cadence}
                  onChange={(event) =>
                    setRoutine((prev) => ({ ...prev, cadence: event.target.value as Routine["cadence"] }))
                  }
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="biweekly">격주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="preferred-day">
                  선호 요일
                </label>
                <select
                  id="preferred-day"
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={routine.preferredDay}
                  onChange={(event) => setRoutine((prev) => ({ ...prev, preferredDay: Number(event.target.value) }))}
                >
                  <option value={0}>일요일</option>
                  <option value={1}>월요일</option>
                  <option value={2}>화요일</option>
                  <option value={3}>수요일</option>
                  <option value={4}>목요일</option>
                  <option value={5}>금요일</option>
                  <option value={6}>토요일</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="routine-notes">
                  메모
                </label>
                <textarea
                  id="routine-notes"
                  className="h-20 w-full rounded-md border border-border px-3 py-2"
                  value={routine.notes ?? ""}
                  onChange={(event) => setRoutine((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">커플 모드</p>
                <p className="text-xs text-muted-foreground">커플과 함께 목표를 공유하고 싶은 경우 선택하세요.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={coupleMode}
                  onChange={(event) => setCoupleMode(event.target.checked)}
                  aria-label="커플 모드 활성화"
                />
                <span className="text-sm">동의</span>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" type="button" onClick={() => setStep(2)}>
                이전 단계
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "생성 중..." : "온보딩 완료"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
