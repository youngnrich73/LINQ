import { describe, expect, it } from "vitest";

import {
  calculateRelationshipScore,
  computeLatencyWeight,
  computeTimeWeight,
  projectScoreTrend,
  type RelationshipSignals,
} from "./scoring";

describe("calculateRelationshipScore", () => {
  const baseSignals: RelationshipSignals = {
    recencyDays: 1,
    frequencyPerWeek: 10,
    responseRate: 0.98,
    valence: 0.8,
    touchDepth: 0.9,
    averageResponseLatencyMinutes: 15,
  };

  it("produces a warm label for high performing signals", () => {
    const result = calculateRelationshipScore(baseSignals);
    expect(result.label).toBe("Warm");
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("caps extreme values to avoid runaway scores", () => {
    const result = calculateRelationshipScore({
      ...baseSignals,
      frequencyPerWeek: 40,
      responseRate: 2,
      valence: 5,
      touchDepth: 4,
      recencyDays: -10,
    });

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(0);
  });

  it("assigns a strained label when interactions are stale", () => {
    const result = calculateRelationshipScore({
      recencyDays: 120,
      frequencyPerWeek: 0,
      responseRate: 0.1,
      valence: -0.8,
      touchDepth: 0.1,
      averageResponseLatencyMinutes: 600,
    });

    expect(result.label).toBe("Strained");
    expect(result.score).toBeLessThan(35);
  });

  it("applies time decay to older signals", () => {
    const recent = calculateRelationshipScore(baseSignals, 0.05);
    const stale = calculateRelationshipScore({ ...baseSignals, deltaDays: 90 }, 0.05);
    expect(stale.score).toBeLessThan(recent.score);
  });

  it("reduces response contribution for long latency", () => {
    const quick = calculateRelationshipScore(baseSignals);
    const slow = calculateRelationshipScore({
      ...baseSignals,
      averageResponseLatencyMinutes: 12 * 60,
    });

    expect(slow.score).toBeLessThan(quick.score);
    expect(slow.breakdown.latencyPenalty).toBeGreaterThan(0);
  });
});

describe("helper functions", () => {
  it("computes latency weights approaching zero for very slow replies", () => {
    expect(computeLatencyWeight(0)).toBeCloseTo(1);
    expect(computeLatencyWeight(24 * 60)).toBeLessThan(0.3);
  });

  it("computes time weights with exponential decay", () => {
    expect(computeTimeWeight(0)).toBeCloseTo(1);
    expect(computeTimeWeight(30)).toBeLessThan(computeTimeWeight(10));
  });
});

describe("projectScoreTrend", () => {
  const signals: RelationshipSignals = {
    recencyDays: 14,
    frequencyPerWeek: 1,
    responseRate: 0.7,
    valence: 0.2,
    touchDepth: 0.5,
    averageResponseLatencyMinutes: 120,
  };

  it("projects improvements when adding more weekly touches", () => {
    const baseline = projectScoreTrend(signals, 0, 4);
    const improved = projectScoreTrend(signals, 1, 4);

    expect(improved[improved.length - 1]).toBeGreaterThan(baseline[baseline.length - 1]);
  });

  it("handles weeks equal to zero", () => {
    expect(projectScoreTrend(signals, 0, 0)).toEqual([]);
  });
});
