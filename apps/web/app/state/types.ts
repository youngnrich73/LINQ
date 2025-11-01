export type PersonGroup = "Inner" | "Close" | "Work";

export interface Interaction {
  id: string;
  personId: string;
  type: "call" | "message" | "note" | "check-in" | "meeting";
  date: string;
  sentiment?: number; // -1..1
  direction?: "outgoing" | "incoming";
  latencyHours?: number;
  note?: string;
  createdVia?: "manual" | "quick-action";
}

export interface Person {
  id: string;
  name: string;
  group: PersonGroup;
  targetPerWeek: number;
  createdAt: string;
  lastInteractionAt?: string;
  interactions?: Interaction[];
  messagesSent?: number;
  messagesReceived?: number;
  averageReplyLatencyHours?: number;
  sentimentTrend?: { date: string; value: number }[];
  topics?: string[];
}

export type CalendarConnectionState = "connected" | "disconnected" | "error";

export type RoutinePreset = "monthly-call" | "biweekly-message" | "quarterly-check-in";

export interface SuggestionExecution {
  id: string;
  personId?: string;
  personName?: string;
  action: string;
  executedAt: string;
}

export interface Settings {
  onboardingDone: boolean;
  notificationsEnabled?: boolean;
  notificationTime?: string;
  quietWeek?: boolean;
  encryptionSummary?: string;
  lastClearedAt?: string;
  calendarStatus?: CalendarConnectionState;
  favoriteGoalPerWeek?: number;
  defaultRoutinePreset?: RoutinePreset;
  recentExecutions?: SuggestionExecution[];
}

export type RoutineRule =
  | { type: "weekly"; count: number }
  | { type: "monthly"; count: number }
  | { type: "custom"; count: number };

export interface Routine {
  id: string;
  personId?: string;
  rule: RoutineRule;
  note?: string;
  createdAt: string;
}

export interface ScheduledTouch {
  id: string;
  routineId: string;
  personId?: string;
  date: string;
  note?: string;
  acknowledged?: boolean;
}

export interface RelationshipMetrics {
  personId: string;
  recencyScore: number;
  frequencyScore: number;
  responsivenessScore: number;
  valenceScore: number;
  topicDiversityScore: number;
  totalScore: number;
  statusLabel: "Warm" | "Cooling" | "Cold" | "Strained";
  nextRecommendedTouch?: string;
  lastInteractionSummary?: string;
}

export interface Suggestion {
  personId: string;
  headline: string;
  template: string;
  explanation: string;
  metrics: RelationshipMetrics;
}
