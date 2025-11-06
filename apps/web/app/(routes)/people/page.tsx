"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../state/data-context";
import type { PersonGroup } from "../../state/types";

const GROUPS: (PersonGroup | "All")[] = ["All", "Inner", "Close", "Work"];
const GROUP_LABELS: Record<(typeof GROUPS)[number], string> = {
  All: "전체",
  Inner: "핵심",
  Close: "가까운 친구",
  Work: "업무",
};
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
      setFormError("이름을 입력해 관계 레이더에 추가하세요.");
      return;
    }
    if (people.length >= 12) {
      setFormError("현재는 최대 12명까지만 즐겨찾을 수 있어요.");
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
      setEditError("이름은 비워둘 수 없어요.");
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
          <CardTitle>중점 인물 관리</CardTitle>
          <p className="text-sm text-muted-foreground">
            따뜻하게 유지하고 싶은 사람을 추가하거나 편집하면 레이더 점수와 루틴에 바로 반영돼요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-sm">
              <span className="font-medium">이름</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                placeholder="김민지"
                aria-label="사람 이름"
                disabled={people.length >= 12}
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">관계 구분</span>
              <select
                value={newGroup}
                onChange={(event) => {
                  setNewGroup(event.target.value as PersonGroup);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="관계 구분"
                disabled={people.length >= 12}
              >
                {GROUPS.filter((option): option is PersonGroup => option !== "All").map((option) => (
                  <option key={option} value={option}>
                    {GROUP_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm">
              <span className="font-medium">주간 목표 접점</span>
              <select
                value={target}
                onChange={(event) => {
                  setTarget(Number(event.target.value));
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                aria-label="주간 목표 접점 수"
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
            <p className="text-sm text-muted-foreground">즐겨찾기 {people.length} / 12명</p>
            <Button onClick={() => void handleAdd()} disabled={submitting || people.length >= 12}>
              {submitting ? "추가 중…" : "사람 추가"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사람 목록</CardTitle>
          <p className="text-sm text-muted-foreground">
            검색하고 필터링해 관계 정보를 살펴보세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="이름으로 검색"
              aria-label="사람 검색"
            />
            <div className="flex items-center gap-2">
              {GROUPS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={group === option ? "secondary" : "outline"}
                  onClick={() => setGroup(option)}
                >
                  {GROUP_LABELS[option] ?? option}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">구분</th>
                  <th className="px-3 py-2">점수</th>
                  <th className="px-3 py-2">최근 접점</th>
                  <th className="px-3 py-2">다음 접점</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">작업</th>
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
                      <td className="px-3 py-3 text-muted-foreground">{GROUP_LABELS[person.group] ?? person.group}</td>
                      <td className="px-3 py-3">{metric?.totalScore ?? "—"}</td>
                      <td className="px-3 py-3">{metric?.lastInteractionSummary ?? "기록 없음"}</td>
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
                            편집
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/people/${person.id}`);
                            }}
                          >
                            프로필 열기
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">필터에 맞는 사람이 아직 없어요.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {editingId ? (
        <Card>
          <CardHeader>
            <CardTitle>사람 편집</CardTitle>
            <p className="text-sm text-muted-foreground">이 연락처의 관계 구분과 접점 빈도를 조정하세요.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col text-sm">
                <span className="font-medium">이름</span>
                <input
                  value={editName}
                  onChange={(event) => {
                    setEditName(event.target.value);
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="이름 편집"
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="font-medium">관계 구분</span>
                <select
                  value={editGroup}
                  onChange={(event) => {
                    setEditGroup(event.target.value as PersonGroup);
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="관계 구분 편집"
                >
                  {GROUPS.filter((option): option is PersonGroup => option !== "All").map((option) => (
                    <option key={option} value={option}>
                      {GROUP_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="font-medium">주간 목표 접점</span>
                <select
                  value={editTarget}
                  onChange={(event) => {
                    setEditTarget(Number(event.target.value));
                    if (editError) {
                      setEditError(null);
                    }
                  }}
                  className="mt-1 rounded-md border border-border bg-background px-3 py-2"
                  aria-label="주간 목표 접점 수 편집"
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
                취소
              </Button>
              <Button onClick={() => void handleEdit()} disabled={savingEdit}>
                {savingEdit ? "저장 중…" : "변경 사항 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
