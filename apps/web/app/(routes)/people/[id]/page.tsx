"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, formatDisplay } from "../../../lib/date";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { useData } from "../../../state/data-context";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { people, metrics, suggestions, logInteraction } = useData();
  const person = people.find((item) => item.id === params?.id);
  const metric = metrics.find((item) => item.personId === params?.id);
  const suggestion = suggestions.find((item) => item.personId === params?.id);
  const [nextStepLoading, setNextStepLoading] = useState(false);

  const interactions = useMemo(() => {
    return [...(person?.interactions ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [person?.interactions]);

  const conversationRatio = useMemo(() => {
    const outgoing = person?.interactions?.filter((interaction) => interaction.direction !== "incoming").length ?? 0;
    const incoming = person?.interactions?.filter((interaction) => interaction.direction === "incoming").length ?? 0;
    const total = outgoing + incoming || 1;
    return {
      outgoing: Math.round((outgoing / total) * 100),
      incoming: Math.round((incoming / total) * 100),
    };
  }, [person?.interactions]);

  const sentimentLine = useMemo(() => {
    const points = (person?.sentimentTrend ?? interactions.map((interaction) => ({
      date: interaction.date,
      value: interaction.sentiment ?? 0,
    }))).slice(-12);
    return points;
  }, [interactions, person?.sentimentTrend]);

  if (!person) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>찾을 수 없어요</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">해당 사람을 찾을 수 없어요. 목록으로 돌아가세요.</p>
          <Button className="mt-3" onClick={() => router.push("/people")}> 
            사람 목록으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleNextStep = async () => {
    setNextStepLoading(true);
    const template = suggestion?.template ?? `${person.name}님께 짧은 메시지를 보내 연결을 이어가요.`;
    await logInteraction(person.id, {
      type: "check-in",
      date: new Date().toISOString(),
      note: template,
      sentiment: suggestion?.metrics.valenceScore ? suggestion.metrics.valenceScore / 100 : 0.5,
      createdVia: "quick-action",
    });
    setNextStepLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{person.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{metric?.statusLabel ?? "모니터링 중"}</p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">타임라인</h3>
            <ul className="mt-3 space-y-3">
              {interactions.length === 0 ? (
                <li className="text-sm text-muted-foreground">기록된 상호작용이 아직 없어요.</li>
              ) : (
                interactions.map((interaction) => (
                  <li key={interaction.id} className="rounded-md border border-border/60 bg-card/50 p-3">
                    <p className="text-sm font-medium">{interaction.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDisplay(new Date(interaction.date), "PPpp")} •
                      {" "}
                      {formatDistanceToNow(new Date(interaction.date), { addSuffix: true })}
                    </p>
                    {interaction.note ? <p className="mt-2 text-sm">{interaction.note}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">대화 비율</h3>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${conversationRatio.outgoing}%` }}
                  aria-label={`내가 먼저 시작 ${conversationRatio.outgoing}%`}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                내가 먼저 {conversationRatio.outgoing}% • 받은 연락 {conversationRatio.incoming}%
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">감정 추세</h3>
              <svg viewBox="0 0 200 60" className="mt-2 h-16 w-full rounded-md border border-border/60 bg-card/30">
                {sentimentLine.length > 1 ? (
                  <polyline
                    points={sentimentLine
                      .map((point, index) => {
                        const x = (index / (sentimentLine.length - 1)) * 200;
                        const y = 60 - ((point.value + 1) / 2) * 60;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                ) : null}
              </svg>
              <p className="mt-1 text-xs text-muted-foreground">최근 {sentimentLine.length}번의 상호작용을 기준으로 했어요.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">다음 추천 접점</h3>
              <p className="mt-1 text-sm">{metric?.nextRecommendedTouch ?? "미정"}</p>
              <Button className="mt-2" onClick={() => void handleNextStep()} disabled={nextStepLoading}>
                {nextStepLoading ? "기록 중…" : "다음 접점 기록"}
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
