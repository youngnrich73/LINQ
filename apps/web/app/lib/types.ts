export interface Person {
  id: string;
  name: string;
  affinityScore?: number;
  emotion?: number;
  recencyDays?: number;
  frequencyPerWeek?: number;
}

export type RoutineCadence = "daily" | "weekly" | "biweekly" | "monthly";

export interface Routine {
  id: string;
  name: string;
  cadence: RoutineCadence;
  preferredDay?: number;
  notes?: string;
  lastCompletedAt?: string;
}

export interface RoutineScheduleItem {
  id: string;
  routineId: string;
  scheduledAt: string;
  completed: boolean;
}

export interface Suggestion {
  id: string;
  personId: string;
  personName: string;
  prompt: string;
  rationale: string;
  sentimentLabel: string;
}

export interface WeeklyGoal {
  touchesPerWeek: number;
}

export interface OnboardingPayload {
  selectedPeople: Person[];
  weeklyGoal: WeeklyGoal;
  routine: Routine;
}

export interface CouplePreferences {
  enabled: boolean;
  partnerEmail?: string;
  consentAt?: string;
}
