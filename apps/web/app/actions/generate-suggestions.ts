"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { calculateRelationshipScore } from "@linq/insights";

import { suggestionTemplates } from "../data/templates";
import type { OnboardingPayload, Person, Suggestion } from "../lib/types";

const SUGGESTION_COOKIE = "linq-top-suggestions";
const WEEKLY_GOAL_COOKIE = "linq-weekly-goal";
const COUPLE_MODE_COOKIE = "linq-couple-mode";

function normalizePerson(person: Person) {
  return {
    recencyDays: person.recencyDays ?? 14,
    frequencyPerWeek: person.frequencyPerWeek ?? 1,
    responseRate: 0.7,
    valence: person.emotion ?? 0,
    touchDepth: person.affinityScore ?? 0.5,
  };
}

function rankTemplates(person: Person) {
  const normalized = normalizePerson(person);
  const score = calculateRelationshipScore({
    recencyDays: normalized.recencyDays,
    frequencyPerWeek: normalized.frequencyPerWeek,
    responseRate: normalized.responseRate,
    valence: normalized.valence,
    touchDepth: normalized.touchDepth,
  });

  const matches = suggestionTemplates
    .filter((template) => {
      return (
        normalized.recencyDays >= template.minRecencyDays &&
        normalized.recencyDays <= template.maxRecencyDays &&
        normalized.frequencyPerWeek >= template.minFrequency &&
        normalized.frequencyPerWeek <= template.maxFrequency &&
        normalized.valence >= template.minEmotion &&
        normalized.valence <= template.maxEmotion
      );
    })
    .map((template) => ({
      template,
      priority: score.score,
    }));

  if (matches.length === 0) {
    matches.push({
      template: suggestionTemplates[0],
      priority: score.score / 2,
    });
  }

  return matches.sort((a, b) => b.priority - a.priority);
}

function buildSuggestion(person: Person, templateId: string, rationale: string): Suggestion {
  return {
    id: `${person.id}-${templateId}`,
    personId: person.id,
    personName: person.name,
    prompt: suggestionTemplates.find((entry) => entry.id === templateId)?.prompt ?? "연결을 시도해보세요.",
    rationale,
    sentimentLabel: rationale.includes("회복") ? "Cooling" : rationale.includes("감사") ? "Warm" : "Balanced",
  };
}

export async function generateFirstWeekSuggestions(payload: OnboardingPayload & { coupleMode?: boolean }) {
  const { selectedPeople, routine, weeklyGoal, coupleMode } = payload;
  const suggestions: Suggestion[] = [];

  selectedPeople.slice(0, 12).forEach((person) => {
    const ranked = rankTemplates(person);
    const top = ranked[0];
    if (top) {
      const rationale = `최근성 ${person.recencyDays ?? "?"}일, 감정 ${person.emotion ?? 0} / 주 ${
        person.frequencyPerWeek ?? 1
      }회 기준`; 
      suggestions.push(buildSuggestion(person, top.template.id, rationale));
    }
  });

  const trimmed = suggestions.slice(0, 5);
  const cookieStore = cookies();
  cookieStore.set(SUGGESTION_COOKIE, JSON.stringify(trimmed), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
  });
  cookieStore.set(WEEKLY_GOAL_COOKIE, JSON.stringify(weeklyGoal), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
  });
  if (coupleMode !== undefined) {
    cookieStore.set(COUPLE_MODE_COOKIE, coupleMode ? "on" : "off", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
    });
  }

  revalidatePath("/");
  return trimmed;
}

export function getSuggestionsFromCookies() {
  const cookieStore = cookies();
  const raw = cookieStore.get(SUGGESTION_COOKIE)?.value;
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Suggestion[];
  } catch (error) {
    console.error("Failed to parse suggestions cookie", error);
    return [];
  }
}

export function getWeeklyGoalFromCookies() {
  const raw = cookies().get(WEEKLY_GOAL_COOKIE)?.value;
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function getCoupleModeFromCookies() {
  return cookies().get(COUPLE_MODE_COOKIE)?.value === "on";
}
