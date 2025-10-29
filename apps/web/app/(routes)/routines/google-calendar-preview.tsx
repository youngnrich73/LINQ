"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linq/ui";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
}

const parseICS = (ics: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  blocks.forEach((block, index) => {
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const startMatch = block.match(/DTSTART[^:]*:(\d{8}T\d{6})/);
    if (summaryMatch && startMatch) {
      const raw = startMatch[1];
      const year = Number(raw.slice(0, 4));
      const month = Number(raw.slice(4, 6)) - 1;
      const day = Number(raw.slice(6, 8));
      const hours = Number(raw.slice(9, 11));
      const minutes = Number(raw.slice(11, 13));
      const date = new Date(Date.UTC(year, month, day, hours, minutes));
      events.push({
        id: `${index}-${raw}`,
        summary: summaryMatch[1].trim(),
        start: date.toISOString(),
      });
    }
  });
  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 5);
};

export const GoogleCalendarPreview = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ICS_URL;
    if (!url) {
      setError("캘린더 URL이 설정되지 않았습니다.");
      return;
    }
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("캘린더를 불러올 수 없습니다.");
        }
        return response.text();
      })
      .then((text) => setEvents(parseICS(text)))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar (읽기 전용)</CardTitle>
        <CardDescription>공개 ICS 주소를 통해 다음 일정 5개를 미리봅니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && events.length === 0 && <p className="text-sm text-muted-foreground">다가오는 일정이 없습니다.</p>}
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <p className="font-medium">{event.summary}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.start).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
