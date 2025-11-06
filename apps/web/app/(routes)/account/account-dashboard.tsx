"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useToast } from "../../components/toast-provider";
import { useData } from "../../state/data-context";
import type { RoutinePreset, SuggestionExecution } from "../../state/types";
import type { AuthSession } from "../../lib/auth-types";

const routinePresetOptions: { value: RoutinePreset; label: string; description: string }[] = [
  { value: "monthly-call", label: "월 2회 통화", description: "한 달에 두 번 통화하세요." },
  { value: "biweekly-message", label: "격주 메시지", description: "격주로 간단한 안부를 보내세요." },
  { value: "quarterly-check-in", label: "분기별 체크인", description: "분기마다 정성스러운 노트를 남기세요." },
];

export function AccountDashboard({ session }: { session: AuthSession }) {
  const { deleteAll, toggleNotifications, settings, updateSettings, people } = useData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceSummary, setDeviceSummary] = useState("이 기기");
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDeviceSummary(describeDevice());
  }, []);

  const calendarBadge = useMemo(() => {
    const status = settings.calendarStatus ?? "disconnected";
    if (status === "connected") {
      return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">연결됨</span>;
    }
    if (status === "error") {
      return <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">오류</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">미연결</span>;
  }, [settings.calendarStatus]);

  const handleNotificationToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextEnabled = await toggleNotifications(event.target.checked);
    push({
      title: nextEnabled ? "D-1 알림 켜짐" : "D-1 알림 꺼짐",
      description: nextEnabled
        ? "예약된 접점 하루 전에 알려드릴게요."
        : "알림을 일시 중지했어요.",
    });
  };

  const handleQuietWeekToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    await updateSettings((prev) => ({ ...prev, quietWeek: event.target.checked }));
    push({
      title: event.target.checked ? "조용한 주간 켜짐" : "조용한 주간 꺼짐",
      description: event.target.checked
        ? "이 설정을 끄기 전까지 추천과 알림을 낮춰드려요."
        : "평소 알림 속도로 돌아갑니다.",
    });
  };

  const handleNotificationTime = async (event: ChangeEvent<HTMLInputElement>) => {
    await updateSettings((prev) => ({ ...prev, notificationTime: event.target.value }));
    push({ title: "알림 시간 변경됨", description: `다음 알림은 ${event.target.value}쯤 발송돼요.` });
  };

  const handleFavoriteGoalPreset = async (value: number) => {
    await updateSettings((prev) => ({ ...prev, favoriteGoalPerWeek: value }));
    push({ title: "목표 빈도를 업데이트했어요", description: `즐겨찾기 목표를 주당 ${value}회로 맞췄어요.` });
  };

  const handleRoutinePreset = async (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = event.target.value as RoutinePreset;
    await updateSettings((prev) => ({ ...prev, defaultRoutinePreset: preset }));
    push({ title: "루틴 기본값을 저장했어요", description: `새 루틴은 ${event.target.selectedOptions[0]?.text}부터 시작해요.` });
  };

  const handleCalendarAction = async () => {
    const nextStatus = settings.calendarStatus === "connected" ? "disconnected" : "connected";
    await updateSettings((prev) => ({ ...prev, calendarStatus: nextStatus }));
    push({
      title: nextStatus === "connected" ? "캘린더 연결됨" : "캘린더 연결 해제됨",
      description:
        nextStatus === "connected"
          ? "읽기 전용 일정 정보를 동기화해 추천에 반영해요."
          : "캘린더 데이터는 더 이상 추천에 사용되지 않아요.",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAll();
      push({ title: "데이터를 삭제했어요", description: "로컬 기록이 모두 지워졌어요.", variant: "destructive" });
      router.replace("/overview");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
      setConfirmText("");
    }
  };

  const recentExecutions = settings.recentExecutions ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>프로필 및 세션</CardTitle>
          <p className="text-sm text-muted-foreground">이메일 계정으로 로그인했습니다.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">{session.user.name ?? session.user.email}</p>
              {session.user.email ? <p className="text-sm text-muted-foreground">{session.user.email}</p> : null}
            </div>
            <div className="text-sm text-muted-foreground" aria-label="현재 사용 중인 기기">{deviceSummary}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] px-4"
              onClick={() =>
                push({
                  title: "다른 기기",
                  description: "보안 대시보드에서 로그아웃할 수 있도록 준비 중입니다.",
                })
              }
              aria-disabled
            >
              다른 기기 로그아웃
            </Button>
            <p className="text-xs text-muted-foreground">다중 기기 동기화가 제공되면 이곳에서 제어할 수 있어요.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>데이터 권한과 출처</CardTitle>
          <p className="text-sm text-muted-foreground">레이더에 반영할 신호를 직접 선택하세요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted-foreground">읽기 전용 일정 정보를 활용해 일정 추천을 개선합니다.</p>
            </div>
            <div className="flex items-center gap-3">
              {calendarBadge}
              <Button
                type="button"
                variant={settings.calendarStatus === "connected" ? "outline" : "secondary"}
                className="min-h-[40px] px-3"
                onClick={() => void handleCalendarAction()}
              >
                {settings.calendarStatus === "connected" ? "연결 해제" : "연결"}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 opacity-60">
            <div>
              <p className="font-medium">연락처 동기화</p>
              <p className="text-sm text-muted-foreground">예정: Google Contacts 즐겨찾기를 불러옵니다.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled aria-disabled /> 허용
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 opacity-60">
            <div>
              <p className="font-medium">파일 업로드</p>
              <p className="text-sm text-muted-foreground">예정: 슬라이드, 브리프, 문서로 프로필을 보강합니다.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled aria-disabled /> 허용
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>백업·복원·삭제</CardTitle>
          <p className="text-sm text-muted-foreground">로컬 우선 저장소는 브라우저에 보관돼요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">백업은 암호화된 스냅샷을 기기에 저장하고, 복원 시 기존 로컬 데이터를 대체합니다.</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="min-h-[40px] px-3" disabled aria-disabled>
              백업 (준비 중)
            </Button>
            <Button type="button" variant="outline" className="min-h-[40px] px-3" disabled aria-disabled>
              복원 (준비 중)
            </Button>
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">모두 삭제</p>
            <p className="text-xs text-muted-foreground">사람, 메모, 루틴, 설정이 삭제되며 되돌릴 수 없어요.</p>
            <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(event) => setConfirmDelete(event.target.checked)}
                aria-label="영구 삭제 확인"
              />
              모든 데이터가 삭제됨을 이해합니다.
            </label>
            <label className="mt-3 flex flex-col text-xs text-foreground">
              <span className="font-medium">확인하려면 DELETE를 입력하세요</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="DELETE"
                inputMode="text"
                className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-describedby="delete-instructions"
              />
            </label>
            <p id="delete-instructions" className="mt-2 text-xs text-muted-foreground">
              삭제 후 앱이 새 상태로 다시 시작돼요.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-3 min-h-[44px] px-4"
              disabled={!confirmDelete || confirmText !== "DELETE" || isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "삭제 중…" : "로컬 데이터 삭제"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 및 조용한 주간</CardTitle>
          <p className="text-sm text-muted-foreground">알림 빈도를 세밀하게 조절하세요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">D-1 알림</p>
              <p className="text-sm text-muted-foreground">그래프에 최소 한 명의 사람이 있어야 해요.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.notificationsEnabled)}
                onChange={handleNotificationToggle}
                disabled={people.length === 0}
                aria-label="하루 전 알림 토글"
              />
              사용 중
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            선호 알림 시간
            <input
              type="time"
              inputMode="numeric"
              value={settings.notificationTime ?? "09:00"}
              onChange={handleNotificationTime}
              className="w-40 rounded-md border border-border bg-background px-3 py-2"
              aria-label="선호 알림 시간"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">조용한 주간</p>
              <p className="text-sm text-muted-foreground">바쁠 때 추천 알림 강도를 낮춰줍니다.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.quietWeek)}
                onChange={handleQuietWeekToggle}
                aria-label="조용한 주간 토글"
              />
              사용 중
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>목표 및 루틴 기본값</CardTitle>
          <p className="text-sm text-muted-foreground">연락 목표 빈도를 다시 설정하세요.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">즐겨찾기 12명 목표</p>
            <p className="text-sm text-muted-foreground">상위 관계에서 주당 몇 회 접점을 기대하는지 선택하세요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={settings.favoriteGoalPerWeek === value ? "secondary" : "outline"}
                  className="min-h-[40px] px-3"
                  onClick={() => void handleFavoriteGoalPreset(value)}
                >
                  주당 {value}회
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex flex-col gap-2 text-sm text-foreground">
              루틴 기본값
              <select
                value={settings.defaultRoutinePreset ?? "monthly-call"}
                onChange={handleRoutinePreset}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                aria-label="루틴 기본값"
              >
                {routinePresetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LINQ 동작 방식</CardTitle>
          <p className="text-sm text-muted-foreground">데이터 → 지표 → 추천</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>이 기기에 추가한 사람, 메모, 루틴을 기반으로 시작합니다.</p>
          <p>그다음 최근 만남, 빈도, 응답성 등 관계 건강 점수를 계산합니다.</p>
          <p>마지막으로 상위 5개의 알림을 제시하고 D-1 알림을 예약해 놓치지 않게 도와드려요.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <p className="text-sm text-muted-foreground">최근 10개의 추천 실행 내역입니다.</p>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">기록이 아직 없어요. 접점을 기록하거나 추천을 적용해 보세요.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentExecutions.map((entry: SuggestionExecution) => (
                <li key={entry.id} className="rounded-md border border-border bg-card/40 px-3 py-2">
                  <p className="font-medium text-foreground">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.personName ? `${entry.personName} · ` : ""}
                    {new Date(entry.executedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function describeDevice() {
  const { userAgent, platform, language } = window.navigator;
  const browserMatch = userAgent.match(/(Edg|Chrome|Safari|Firefox|Opera|Brave|CriOS)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0].replace("/", " ") : "브라우저";
  return `${platform ?? "기기"} · ${browser} · ${language}`;
}
