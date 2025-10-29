"use client";

import { useState } from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linq/ui";

export const WeeklyCheckInCard = () => {
  const [mood, setMood] = useState("");
  const [compliment, setCompliment] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "linq-weekly-checkin",
        JSON.stringify({ mood, compliment, gratitude, submittedAt: new Date().toISOString() }),
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>주간 체크인</CardTitle>
        <CardDescription>기분 / 칭찬 / 감사 한 줄씩 적어보세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">기분</span>
          <input
            className="rounded-md border border-border px-3 py-2"
            value={mood}
            onChange={(event) => setMood(event.target.value)}
            placeholder="이번 주 기분 한 줄"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">칭찬</span>
          <input
            className="rounded-md border border-border px-3 py-2"
            value={compliment}
            onChange={(event) => setCompliment(event.target.value)}
            placeholder="상대에게 전하고 싶은 칭찬"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">감사</span>
          <input
            className="rounded-md border border-border px-3 py-2"
            value={gratitude}
            onChange={(event) => setGratitude(event.target.value)}
            placeholder="감사 한 줄"
          />
        </label>
        <Button type="button" onClick={handleSubmit} disabled={submitted}>
          {submitted ? "제출됨" : "기록하기"}
        </Button>
      </CardContent>
    </Card>
  );
};
