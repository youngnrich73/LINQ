export type RelationshipLabel = "Warm" | "Cooling" | "Cold" | "Strained";

export interface RelationshipSignals {
  /** Recency in days since last meaningful interaction (R). Lower is better. */
  recencyDays: number;
  /** Weekly interaction frequency (F). Higher is better. */
  frequencyPerWeek: number;
  /** Response rate ratio between 0 and 1 (RR). Higher is better. */
  responseRate: number;
  /** Sentiment valence in the range [-1, 1] (V). Higher is better. */
  valence: number;
  /** Touch depth score in the range [0, 1] describing intimacy of recent touches (TD). */
  touchDepth: number;
  /**
   * Days since the signal snapshot was captured. Used for exponential time decay.
   * Defaults to the recency value if omitted.
   */
  deltaDays?: number;
  /**
   * Average response latency in minutes. Used in the reciprocal log delay weighting.
   */
  averageResponseLatencyMinutes?: number;
}

export interface RelationshipScore {
  score: number;
  label: RelationshipLabel;
  breakdown: {
    recency: number;
    frequency: number;
    response: number;
    sentiment: number;
    depth: number;
    latencyPenalty: number;
    timeWeight: number;
  };
}

const DEFAULT_LAMBDA = 0.04;
const MAX_LATENCY_MINUTES = 24 * 60;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const interpolate = (value: number, inMin: number, inMax: number) => {
  if (inMax === inMin) {
    return 0;
  }
  const ratio = (value - inMin) / (inMax - inMin);
  return clamp(ratio, 0, 1);
};

const latencyWeight = (latencyMinutes: number) => {
  const bounded = clamp(latencyMinutes, 0, MAX_LATENCY_MINUTES);
  const hours = bounded / 60;
  return 1 / (1 + Math.log1p(hours));
};

const timeWeight = (deltaDays: number, lambda = DEFAULT_LAMBDA) => {
  return Math.exp(-lambda * deltaDays);
};

const RECENCY_BOUNDS = { min: 0, max: 60 };
const FREQUENCY_BOUNDS = { min: 0, max: 14 };

export function calculateRelationshipScore(
  signals: RelationshipSignals,
  lambda = DEFAULT_LAMBDA,
): RelationshipScore {
  const {
    recencyDays,
    frequencyPerWeek,
    responseRate,
    valence,
    touchDepth,
    deltaDays,
    averageResponseLatencyMinutes,
  } = signals;

  const effectiveDelta = deltaDays ?? recencyDays;
  const weight = timeWeight(effectiveDelta, lambda);

  const recencyComponent = 1 - interpolate(recencyDays, RECENCY_BOUNDS.min, RECENCY_BOUNDS.max);
  const frequencyComponent = interpolate(
    frequencyPerWeek,
    FREQUENCY_BOUNDS.min,
    FREQUENCY_BOUNDS.max,
  );
  const responseComponent = clamp(responseRate, 0, 1);
  const sentimentComponent = (clamp(valence, -1, 1) + 1) / 2;
  const depthComponent = clamp(touchDepth, 0, 1);

  const latencyComponent = latencyWeight(averageResponseLatencyMinutes ?? 0);
  const latencyPenalty = 1 - latencyComponent;

  const composite =
    weight *
    (0.25 * recencyComponent +
      0.2 * frequencyComponent +
      0.2 * responseComponent * latencyComponent +
      0.2 * sentimentComponent +
      0.15 * depthComponent);

  const score = Math.round(clamp(composite * 100, 0, 100));
  const label = score >= 70 ? "Warm" : score >= 50 ? "Cooling" : score >= 30 ? "Cold" : "Strained";

  return {
    score,
    label,
    breakdown: {
      recency: recencyComponent,
      frequency: frequencyComponent,
      response: responseComponent,
      sentiment: sentimentComponent,
      depth: depthComponent,
      latencyPenalty,
      timeWeight: weight,
    },
  };
}

export function projectScoreTrend(
  baseSignals: RelationshipSignals,
  weeklyTouchDelta: number,
  weeks: number,
  lambda = DEFAULT_LAMBDA,
): number[] {
  const trend: number[] = [];
  for (let week = 0; week < weeks; week += 1) {
    const frequency = Math.max(baseSignals.frequencyPerWeek + weeklyTouchDelta * week, 0);
    const recency = Math.max(baseSignals.recencyDays - week * 7, 0);
    const projection = calculateRelationshipScore(
      {
        ...baseSignals,
        frequencyPerWeek: frequency,
        recencyDays: recency,
        deltaDays: week * 7,
      },
      lambda,
    );
    trend.push(projection.score);
  }
  return trend;
}

export { latencyWeight as computeLatencyWeight, timeWeight as computeTimeWeight };
