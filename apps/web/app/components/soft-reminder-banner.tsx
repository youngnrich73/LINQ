"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card } from "@linq/ui";

import { loadSchedule } from "../lib/routines-store";

export const SoftReminderBanner = () => {
  const [missedCount, setMissedCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadSchedule().then((schedule) => {
      const now = new Date();
      const missed = schedule.filter((item) => !item.completed && new Date(item.scheduledAt) < now);
      setMissedCount(missed.length);
    });
  }, []);

  if (missedCount === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-900">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">부드러운 알림</p>
          <p className="text-sm">{missedCount}개의 루틴이 아직 완료되지 않았어요. 오늘 가볍게 안부를 전해볼까요?</p>
        </div>
        <Button
          variant="outline"
          className="border-amber-300 text-amber-900 hover:bg-amber-100"
          onClick={() => router.push("/routines")}
        >
          루틴 확인하기
        </Button>
      </div>
    </Card>
  );
};
