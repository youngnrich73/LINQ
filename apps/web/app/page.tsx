import { RelationshipRadar, TopSuggestionsCard, type RelationshipRadarDatum } from "@linq/ui";

import {
  getCoupleModeFromCookies,
  getSuggestionsFromCookies,
  getWeeklyGoalFromCookies,
} from "./lib/suggestion-cookies";
import { SoftReminderBanner } from "./components/soft-reminder-banner";
import { WeeklyCheckInCard } from "./components/weekly-check-in-card";

export default function HomePage() {
  const suggestions = getSuggestionsFromCookies();
  const coupleMode = getCoupleModeFromCookies();
  const weeklyGoal = getWeeklyGoalFromCookies();

  const radarData = (suggestions.length > 0
    ? suggestions
    : [
        {
          id: "alex",
          personName: "Alex Kim",
          prompt: "이번 주 짧은 메시지를 보내보세요.",
          rationale: "최근성 10일, 감정 0.1",
          sentimentLabel: "Cooling",
        },
        {
          id: "dana",
          personName: "Dana Lee",
          prompt: "감사 한 줄을 전하세요.",
          rationale: "최근성 5일, 감정 0.5",
          sentimentLabel: "Warm",
        },
        {
          id: "morgan",
          personName: "Morgan Choi",
          prompt: "가벼운 안부를 남겨보세요.",
          rationale: "최근성 30일, 감정 -0.2",
          sentimentLabel: "Cold",
        },
      ]
  ).map<RelationshipRadarDatum>((entry, index) => ({
    id: entry.id,
    name: entry.personName,
    recencyDays: 5 + index * 7,
    emotion: entry.sentimentLabel === "Warm" ? 0.6 : entry.sentimentLabel === "Cooling" ? 0.1 : -0.4,
    frequencyPerWeek: 1 + index * 0.5,
    trend: index % 2 === 0 ? "improving" : "steady",
  }));

  return (
    <div className="space-y-6 p-6">
      <SoftReminderBanner />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <RelationshipRadar data={radarData} />
        <TopSuggestionsCard
          suggestions={
            suggestions.length > 0
              ? suggestions
              : [
                  {
                    id: "sample-1",
                    personName: "Alex Kim",
                    prompt: "최근 웃었던 사진을 공유해보세요.",
                    rationale: "최근성 10일 기준",
                    sentimentLabel: "Cooling",
                  },
                  {
                    id: "sample-2",
                    personName: "Dana Lee",
                    prompt: "감사 한 줄을 전해주세요.",
                    rationale: "감정 점수 높음",
                    sentimentLabel: "Warm",
                  },
                ]
          }
          caption={weeklyGoal ? `주간 목표 ${weeklyGoal.touchesPerWeek}회 기준 제안` : undefined}
        />
      </div>
      <WeeklyCheckInCard />
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        커플 모드: <strong>{coupleMode ? "활성화" : "비활성화"}</strong>
      </div>
    </div>
  );
}
