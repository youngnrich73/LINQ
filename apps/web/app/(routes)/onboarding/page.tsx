"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center">
      <Card className="max-w-xl border-primary/40">
        <CardHeader>
          <CardTitle className="text-2xl">시작하기</CardTitle>
          <p className="text-sm text-muted-foreground">
            대시보드 준비가 끝났어요. People 페이지에서 VIP 목록을 추가하거나 수정하면 레이더, 추천, 루틴, 알림이 자동으로 채워집니다.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/overview")} variant="secondary">
            요약 보기
          </Button>
          <Button onClick={() => router.push("/people")}>사람 관리</Button>
        </CardContent>
      </Card>
    </div>
  );
}
