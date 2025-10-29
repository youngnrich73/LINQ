import { cookies } from "next/headers";

import type { Suggestion, WeeklyGoal } from "./types";

export const SUGGESTION_COOKIE = "linq-top-suggestions";
export const WEEKLY_GOAL_COOKIE = "linq-weekly-goal";
export const COUPLE_MODE_COOKIE = "linq-couple-mode";

export function getSuggestionsFromCookies(): Suggestion[] {
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

export function getWeeklyGoalFromCookies(): WeeklyGoal | undefined {
  const raw = cookies().get(WEEKLY_GOAL_COOKIE)?.value;
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as WeeklyGoal;
  } catch (error) {
    console.error("Failed to parse weekly goal cookie", error);
    return undefined;
  }
}

export function getCoupleModeFromCookies(): boolean {
  return cookies().get(COUPLE_MODE_COOKIE)?.value === "on";
}
