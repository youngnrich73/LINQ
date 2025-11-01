"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@linq/ui";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center">
      <Card className="max-w-xl border-primary/40">
        <CardHeader>
          <CardTitle className="text-2xl">Getting started</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your dashboard is ready. Add or edit your VIP list from the People page and we&apos;ll populate the radar,
            suggestions, routines, and notifications automatically.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/overview")} variant="secondary">
            View overview
          </Button>
          <Button onClick={() => router.push("/people")}>Manage people</Button>
        </CardContent>
      </Card>
    </div>
  );
}
