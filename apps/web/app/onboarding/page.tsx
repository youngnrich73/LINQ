import { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linq/ui";

import { OnboardingFlow } from "./steps";

export const metadata: Metadata = {
  title: "Relationship Onboarding",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>관계 온보딩</CardTitle>
          <CardDescription>최우선 12인을 정하고 루틴을 설정해 첫 주 제안을 받아보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingFlow />
        </CardContent>
      </Card>
    </div>
  );
}
