"use client";

import { formatDisplay } from "../../lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@linq/ui";
import { RelationshipRadar } from "../../components/relationship-radar";
import { TopSuggestions } from "../../components/top-suggestions";
import { UpcomingTouches } from "../../components/upcoming-touches";
import { useData } from "../../state/data-context";

export default function OverviewPage() {
  const { people, metrics, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>대시보드를 불러오는 중…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">관계 지표를 수집하고 있어요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = metrics.reduce(
    (acc, metric) => {
      acc.score += metric.totalScore;
      acc.count += 1;
      acc.warm += metric.statusLabel === "Warm" ? 1 : 0;
      return acc;
    },
    { score: 0, count: 0, warm: 0 }
  );

  const averageScore = summary.count > 0 ? Math.round(summary.score / summary.count) : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>평균 점수</CardTitle>
            <p className="text-sm text-muted-foreground">레이더 전반의 통합 점수예요.</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{averageScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>가까운 관계</CardTitle>
            <p className="text-sm text-muted-foreground">점수 75 이상인 사람 수예요.</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.warm}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>마지막 갱신 시각</CardTitle>
            <p className="text-sm text-muted-foreground">대기 중이거나 탭으로 돌아오면 자동으로 갱신돼요.</p>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{formatDisplay(new Date(), "PPpp")}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>관계 레이더</CardTitle>
          <p className="text-sm text-muted-foreground">거리 = 최근 만남, 색 = 감정, 점 크기 = 빈도입니다. 점을 누르면 프로필로 이동해요.</p>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              People 페이지에서 사람을 추가하면 관계 건강을 확인할 수 있어요.
            </div>
          ) : (
            <RelationshipRadar people={people} metrics={metrics} />
          )}
        </CardContent>
      </Card>

      <TopSuggestions />
      <UpcomingTouches />
    </div>
  );
}
