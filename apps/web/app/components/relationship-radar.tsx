"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "../state/types";
import type { RelationshipMetrics } from "../state/types";

interface RelationshipRadarProps {
  people: Person[];
  metrics: RelationshipMetrics[];
}

export function RelationshipRadar({ people, metrics }: RelationshipRadarProps) {
  const router = useRouter();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const points = useMemo(() => {
    const merged = metrics
      .map((metric) => {
        const person = people.find((item) => item.id === metric.personId);
        if (!person) return undefined;
        const recencyNormalized = metric.recencyScore / 100;
        const radius = (1 - recencyNormalized) * 180;
        const angle = ((people.indexOf(person) / Math.max(people.length, 1)) * Math.PI * 2) % (Math.PI * 2);
        const x = 200 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;
        const colorHue = (metric.valenceScore / 100) * 120;
        const size = 8 + (metric.frequencyScore / 100) * 18;
        return {
          id: person.id,
          name: person.name,
          metric,
          x,
          y,
          color: `hsl(${colorHue} 80% 45%)`,
          size,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return merged;
  }, [metrics, people]);

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Add interactions to see the radar populate with recency, valence, and frequency.
      </div>
    );
  }

  const activePoint = points.find((point) => point.id === focusedId) ?? points[0];

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_240px]">
      <div className="relative">
        <svg
          viewBox="0 0 400 400"
          role="img"
          aria-label="Relationship radar plotting recency, valence, and frequency"
          className="w-full rounded-lg border bg-background"
        >
          {[1, 2, 3, 4].map((ring) => (
            <circle
              key={ring}
              cx={200}
              cy={200}
              r={ring * 45}
              className="fill-none stroke-muted"
              strokeDasharray="4 6"
              strokeWidth={0.5}
            />
          ))}
          <circle cx={200} cy={200} r={3} className="fill-primary" />
          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.size}
                fill={point.color}
                opacity={focusedId && focusedId !== point.id ? 0.5 : 0.85}
              />
              <foreignObject
                x={point.x - point.size}
                y={point.y - point.size}
                width={point.size * 2}
                height={point.size * 2}
              >
                <button
                  type="button"
                  aria-label={`${point.name}: score ${point.metric.totalScore}`}
                  className="h-full w-full rounded-full border border-transparent focus-visible:border-ring focus-visible:outline-none"
                  onClick={() => router.push(`/people/${point.id}`)}
                  onFocus={() => setFocusedId(point.id)}
                  onBlur={() => setFocusedId(null)}
                  onMouseEnter={() => setFocusedId(point.id)}
                  onMouseLeave={() => setFocusedId(null)}
                />
              </foreignObject>
            </g>
          ))}
        </svg>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground" />Distance = Recency</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gradient-to-r from-red-400 to-green-400" />Color = Valence</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-muted-foreground" />Dot size = Frequency</div>
        </div>
      </div>
      <aside aria-live="polite" className="rounded-lg border bg-card/40 p-4 text-sm">
        <h3 className="text-base font-semibold">Details</h3>
        <p className="mt-1 text-muted-foreground">
          Hover or focus a contact to see the health summary. Click to jump into their dossier.
        </p>
        {activePoint ? (
          <dl className="mt-4 space-y-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
              <dd className="text-base font-semibold">{activePoint.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Score</dt>
              <dd>{activePoint.metric.totalScore} ({activePoint.metric.statusLabel})</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Recency</dt>
              <dd>{activePoint.metric.recencyScore}/100</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Next touch</dt>
              <dd>{activePoint.metric.nextRecommendedTouch}</dd>
            </div>
          </dl>
        ) : null}
      </aside>
    </div>
  );
}
