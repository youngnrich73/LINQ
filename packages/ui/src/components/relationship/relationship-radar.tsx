import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

export interface RelationshipRadarDatum {
  id: string;
  name: string;
  recencyDays: number;
  emotion: number; // -1..1
  frequencyPerWeek: number;
  trend?: "improving" | "declining" | "steady";
}

export interface RelationshipRadarProps {
  data: RelationshipRadarDatum[];
  maxRecencyDays?: number;
  maxFrequencyPerWeek?: number;
  className?: string;
  title?: string;
  onFocusPerson?: (id: string) => void;
}

const DEFAULT_SIZE = 340;

const emotionToColor = (value: number) => {
  const clamped = Math.max(-1, Math.min(1, value));
  const hue = ((clamped + 1) / 2) * 120; // red (-1) → green (+1)
  return `hsl(${hue} 70% 50%)`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const RelationshipRadar: React.FC<RelationshipRadarProps> = ({
  data,
  maxRecencyDays = 120,
  maxFrequencyPerWeek = 14,
  className,
  title = "Relationship Radar",
  onFocusPerson,
}) => {
  const center = DEFAULT_SIZE / 2;
  const radius = center - 32;

  const labelledBy = React.useId();

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader>
        <CardTitle id={labelledBy}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto aspect-square max-w-full" style={{ maxWidth: DEFAULT_SIZE }}>
          <svg
            role="img"
            aria-labelledby={labelledBy}
            viewBox={`0 0 ${DEFAULT_SIZE} ${DEFAULT_SIZE}`}
            className="h-full w-full"
          >
            <circle cx={center} cy={center} r={radius} className="fill-muted" opacity={0.15} />
            {[0.25, 0.5, 0.75, 1].map((fraction) => (
              <circle
                key={fraction}
                cx={center}
                cy={center}
                r={radius * fraction}
                className="stroke-border"
                fill="none"
                strokeDasharray="4 4"
                opacity={0.4}
              />
            ))}
            {data.map((datum, index) => {
              const angle = (index / data.length) * Math.PI * 2 - Math.PI / 2;
              const recencyScaled =
                radius * (1 - clamp(datum.recencyDays, 0, maxRecencyDays) / maxRecencyDays);
              const size = 10 +
                30 * (clamp(datum.frequencyPerWeek, 0, maxFrequencyPerWeek) / maxFrequencyPerWeek);
              const x = center + Math.cos(angle) * recencyScaled;
              const y = center + Math.sin(angle) * recencyScaled;

              return (
                <React.Fragment key={datum.id}>
                  <line
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    className="stroke-border"
                    opacity={0.2}
                  />
                  <g transform={`translate(${x}, ${y})`}>
                    <title>{`${datum.name}: ${datum.frequencyPerWeek.toFixed(1)} weekly touches, ${datum.recencyDays} days since last`}</title>
                    <circle
                      r={size / 2}
                      fill={emotionToColor(datum.emotion)}
                      className="transition-all duration-200 ease-in-out"
                      opacity={0.8}
                    />
                    {datum.trend && (
                      <text
                        y={-size / 1.8}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-foreground"
                      >
                        {datum.trend === "improving" ? "▲" : datum.trend === "declining" ? "▼" : "•"}
                      </text>
                    )}
                  </g>
                </React.Fragment>
              );
            })}
          </svg>
          <ul className="sr-only">
            {data.map((datum) => (
              <li key={datum.id}>
                {datum.name}: last connected {datum.recencyDays} days ago, {datum.frequencyPerWeek.toFixed(1)}
                ×/week, emotion {datum.emotion.toFixed(2)}.
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.map((datum) => (
            <button
              key={`focus-${datum.id}`}
              type="button"
              onClick={() => onFocusPerson?.(datum.id)}
              className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="font-medium">{datum.name}</span>
              <span className="text-xs text-muted-foreground">
                {datum.recencyDays}d • {datum.frequencyPerWeek.toFixed(1)}/wk
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
