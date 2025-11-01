"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  formatISO,
  isBefore,
  isWithinInterval,
  subDays,
} from "../lib/date";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAllData,
  getDatabase,
  loadAll,
  persistInteraction,
  persistPerson,
  persistRoutine,
  persistSettings,
  persistTouch,
  persistTouches,
} from "./data-store";
import type {
  Interaction,
  Person,
  PersonGroup,
  RelationshipMetrics,
  Routine,
  ScheduledTouch,
  Settings,
  Suggestion,
} from "./types";

interface DataContextValue {
  loading: boolean;
  people: Person[];
  settings: Settings;
  routines: Routine[];
  touches: ScheduledTouch[];
  metrics: RelationshipMetrics[];
  suggestions: Suggestion[];
  addPerson(input: { name: string; group: PersonGroup; targetPerWeek: number }): Promise<void>;
  updatePerson(id: string, updates: Partial<Person>): Promise<void>;
  logInteraction(personId: string, interaction: Omit<Interaction, "id" | "personId">): Promise<void>;
  markOnboardingDone(): Promise<void>;
  deleteAll(): Promise<void>;
  addRoutine(input: { personId?: string; rule: Routine["rule"]; note?: string }): Promise<void>;
  toggleNotifications(enabled: boolean): Promise<void>;
  acknowledgeTouch(id: string): Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const METRIC_REFRESH_MS = 1000 * 60 * 5;
const MAX_SUGGESTIONS = 5;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [settings, setSettings] = useState<Settings>({ onboardingDone: false });
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [touches, setTouches] = useState<ScheduledTouch[]>([]);
  const [metrics, setMetrics] = useState<RelationshipMetrics[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const dbRef = useRef<Awaited<ReturnType<typeof getDatabase>>>();
  const router = useRouter();
  const pathname = usePathname();
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      const db = await getDatabase();
      dbRef.current = db;
      const { people: storedPeople, routines: storedRoutines, touches: storedTouches, settings: storedSettings } =
        await loadAll(db);
      setPeople(storedPeople);
      setRoutines(storedRoutines);
      setTouches(storedTouches);
      setSettings(storedSettings);
      setLoading(false);
    }

    void init();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    const shouldRedirect = !settings.onboardingDone && pathname !== "/onboarding";
    if (shouldRedirect) {
      router.replace("/onboarding");
    }
  }, [loading, pathname, router, settings.onboardingDone]);

  const recomputeMetrics = useCallback(() => {
    setMetrics(() => {
      const nextMetrics = people.map((person) =>
        calculateMetrics(person, touches.filter((touch) => touch.personId === person.id))
      );
      return nextMetrics;
    });
  }, [people, touches]);

  useEffect(() => {
    if (metrics.length === 0) {
      setSuggestions([]);
      return;
    }
    const computedSuggestions = computeSuggestions(metrics, people);
    setSuggestions(computedSuggestions);
  }, [metrics, people]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recomputeMetrics();
      }
    };
    const interval = window.setInterval(recomputeMetrics, METRIC_REFRESH_MS);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", recomputeMetrics);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", recomputeMetrics);
    };
  }, [recomputeMetrics]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (settings.notificationsEnabled) {
      navigator.serviceWorker
        ?.register("/sw.js")
        .catch(() => {
          // Registration failures are non-fatal for local-first mode.
        });
    }
  }, [settings.notificationsEnabled]);

  useEffect(() => {
    if (
      !settings.notificationsEnabled ||
      typeof window === "undefined" ||
      typeof Notification === "undefined"
    ) {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
      timersRef.current = {};
      return;
    }

    const timers: Record<string, number> = {};
    touches.forEach((touch) => {
      if (touch.acknowledged) return;
      const touchDate = new Date(touch.date);
      const notifyAt = subDays(touchDate, 1);
      const msUntilNotify = notifyAt.getTime() - Date.now();
      if (msUntilNotify <= 0 || msUntilNotify > 1000 * 60 * 60 * 24 * 14) {
        return;
      }
      timers[touch.id] = window.setTimeout(() => {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const personName = people.find((p) => p.id === touch.personId)?.name ?? "Someone";
          void navigator.serviceWorker?.ready.then((registration) => {
            registration.showNotification("Upcoming connection", {
              body: `Reach out to ${personName} tomorrow.`,
            });
          });
        }
      }, msUntilNotify);
    });

    Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
    timersRef.current = timers;
  }, [people, touches, settings.notificationsEnabled]);

  useEffect(() => {
    if (!loading) {
      recomputeMetrics();
    }
  }, [loading, recomputeMetrics]);

  const addPerson = useCallback<DataContextValue["addPerson"]>(
    async ({ name, group, targetPerWeek }) => {
      const db = dbRef.current;
      if (!db) return;
      const now = new Date();
      const person: Person = {
        id: crypto.randomUUID(),
        name,
        group,
        targetPerWeek,
        createdAt: formatISO(now),
        interactions: [],
      };
      await persistPerson(db, person);
      setPeople((prev) => [...prev, person]);
    },
    []
  );

  const updatePerson = useCallback<DataContextValue["updatePerson"]>(
    async (id, updates) => {
      const db = dbRef.current;
      if (!db) return;
      setPeople((prev) => {
        const next = prev.map((person) =>
          person.id === id ? { ...person, ...updates } : person
        );
        const updated = next.find((person) => person.id === id);
        if (updated) {
          void persistPerson(db, updated);
        }
        return next;
      });
    },
    []
  );

  const logInteraction = useCallback<DataContextValue["logInteraction"]>(
    async (personId, interactionInput) => {
      const db = dbRef.current;
      if (!db) return;
      const interaction: Interaction = {
        id: crypto.randomUUID(),
        personId,
        ...interactionInput,
      };
      await persistInteraction(db, interaction);
      setPeople((prev) =>
        prev.map((person) =>
          person.id === personId
            ? {
                ...person,
                lastInteractionAt: interaction.date,
                interactions: [...(person.interactions ?? []), interaction].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                ),
              }
            : person
        )
      );
    },
    []
  );

  const markOnboardingDone = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    const nextSettings: Settings = {
      ...settings,
      onboardingDone: true,
      encryptionSummary: settings.encryptionSummary ?? "AES-256 at rest (browser storage)",
    };
    setSettings(nextSettings);
    await persistSettings(db, nextSettings);
    router.replace("/overview");
  }, [router, settings]);

  const deleteAll = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    await clearAllData(db);
    setPeople([]);
    setRoutines([]);
    setTouches([]);
    setSettings({ onboardingDone: false, lastClearedAt: new Date().toISOString() });
    setMetrics([]);
    setSuggestions([]);
    router.replace("/onboarding");
  }, [router]);

  const addRoutine = useCallback<DataContextValue["addRoutine"]>(
    async ({ personId, rule, note }) => {
      const db = dbRef.current;
      if (!db) return;
      const routine: Routine = {
        id: crypto.randomUUID(),
        personId,
        rule,
        note,
        createdAt: formatISO(new Date()),
      };
      await persistRoutine(db, routine);
      const generatedTouches = buildUpcomingTouches(routine, touches, personId);
      if (generatedTouches.length > 0) {
        await persistTouches(db, generatedTouches);
      }
      setRoutines((prev) => [...prev, routine]);
      if (generatedTouches.length > 0) {
        setTouches((prev) => {
          const deduped = [...prev];
          generatedTouches.forEach((touch) => {
            if (!deduped.some((item) => item.id === touch.id)) {
              deduped.push(touch);
            }
          });
          return deduped;
        });
      }
    },
    [touches]
  );

  const acknowledgeTouch = useCallback(async (id: string) => {
    const db = dbRef.current;
    if (!db) return;
    setTouches((prev) => {
      const next = prev.map((touch) =>
        touch.id === id ? { ...touch, acknowledged: true } : touch
      );
      next
        .filter((touch) => touch.id === id)
        .forEach((touch) => {
          void persistTouch(db, touch);
        });
      return next;
    });
  }, []);

  const toggleNotifications = useCallback(async (enabled: boolean) => {
    const db = dbRef.current;
    if (!db) return;
    let nextEnabled = enabled;
    if (nextEnabled && typeof window !== "undefined" && typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        nextEnabled = false;
      }
    } else if (nextEnabled) {
      nextEnabled = false;
    }
    const nextSettings = { ...settings, notificationsEnabled: nextEnabled };
    setSettings(nextSettings);
    await persistSettings(db, nextSettings);
  }, [settings]);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      people,
      settings,
      routines,
      touches,
      metrics,
      suggestions,
      addPerson,
      updatePerson,
      logInteraction,
      markOnboardingDone,
      deleteAll,
      addRoutine,
      toggleNotifications,
      acknowledgeTouch,
    }),
    [
      acknowledgeTouch,
      addPerson,
      addRoutine,
      deleteAll,
      loading,
      logInteraction,
      metrics,
      people,
      routines,
      settings,
      suggestions,
      toggleNotifications,
      touches,
      updatePerson,
      markOnboardingDone,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }
  return context;
}

function calculateMetrics(person: Person, upcomingTouches: ScheduledTouch[]): RelationshipMetrics {
  const now = new Date();
  const lastInteractionDate = person.lastInteractionAt
    ? new Date(person.lastInteractionAt)
    : person.interactions && person.interactions.length > 0
      ? new Date(person.interactions.at(-1)!.date)
      : new Date(person.createdAt);
  const daysSinceInteraction = Math.max(0, differenceInCalendarDays(now, lastInteractionDate));
  const recencyWeight = Math.exp(-0.08 * daysSinceInteraction);
  const recencyScore = Math.round(recencyWeight * 100);

  const interactions = person.interactions ?? [];
  const interactions30 = interactions.filter((interaction) =>
    isWithinInterval(new Date(interaction.date), {
      start: subDays(now, 30),
      end: now,
    })
  );
  const interactions90 = interactions.filter((interaction) =>
    isWithinInterval(new Date(interaction.date), {
      start: subDays(now, 90),
      end: now,
    })
  );
  const targetTouches90 = person.targetPerWeek * 12;
  const frequencyRatio = targetTouches90 > 0 ? Math.min(1, (interactions30.length * 0.6 + interactions90.length * 0.4) / targetTouches90) : 0;
  const frequencyScore = Math.round(frequencyRatio * 100);

  const sent = person.messagesSent ?? Math.max(interactions.length * 0.6, 1);
  const received = person.messagesReceived ?? Math.max(interactions.length * 0.4, 1);
  const ratio = sent > 0 && received > 0 ? Math.min(1, received / sent) : 0.8;
  const latency = person.averageReplyLatencyHours ?? 6;
  const latencyTransform = 1 / (1 + Math.log(1 + Math.max(latency, 0.1)));
  const responsivenessScore = Math.round(Math.min(1, 0.5 * ratio + 0.5 * latencyTransform) * 100);

  const sentimentTrend = person.sentimentTrend ?? interactions
    .filter((item) => typeof item.sentiment === "number")
    .map((item) => ({ date: item.date, value: item.sentiment ?? 0 }));
  const latestSentiment = sentimentTrend.length > 0 ? sentimentTrend.at(-1)!.value : 0;
  const valenceScore = Math.round(((latestSentiment + 1) / 2) * 100);

  const topicDiversityScore = Math.round(
    Math.min(1, ((person.topics?.length ?? 2) + 2) / 10) * 100
  );

  const weightedScore =
    recencyScore * 0.28 +
    frequencyScore * 0.22 +
    responsivenessScore * 0.2 +
    valenceScore * 0.2 +
    topicDiversityScore * 0.1;
  const totalScore = Math.round(weightedScore);

  const statusLabel =
    totalScore >= 75 ? "Warm" : totalScore >= 55 ? "Cooling" : totalScore >= 35 ? "Cold" : "Strained";

  const cadenceDays = person.targetPerWeek > 0 ? Math.round(7 / person.targetPerWeek) : 14;
  const suggestedDate = addDays(lastInteractionDate, cadenceDays);
  const futureTouch = upcomingTouches
    .map((touch) => new Date(touch.date))
    .filter((date) => date.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const nextRecommendedTouch = formatISO(
    futureTouch && isBefore(futureTouch, suggestedDate) ? futureTouch : suggestedDate,
    { representation: "date" }
  );

  const lastInteractionSummary = interactions.length
    ? `Last ${interactions.at(-1)!.type} ${differenceInCalendarDays(now, new Date(interactions.at(-1)!.date))}d ago`
    : `No activity yet`;

  return {
    personId: person.id,
    recencyScore,
    frequencyScore,
    responsivenessScore,
    valenceScore,
    topicDiversityScore,
    totalScore,
    statusLabel,
    nextRecommendedTouch,
    lastInteractionSummary,
  };
}

function computeSuggestions(metrics: RelationshipMetrics[], people: Person[]): Suggestion[] {
  const enriched = metrics
    .map((metric) => {
      const person = people.find((item) => item.id === metric.personId);
      if (!person) return undefined;
      const intensity = 100 - metric.totalScore;
      const template = chooseTemplate(metric, person);
      const explanation = buildExplanation(metric);
      return {
        personId: person.id,
        headline: `${person.name}: ${metric.statusLabel}`,
        template,
        explanation,
        metrics: metric,
        intensity,
      };
    })
    .filter((item): item is Suggestion & { intensity: number } => Boolean(item))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, MAX_SUGGESTIONS);

  return enriched.map((item) => {
    const { intensity, ...rest } = item;
    void intensity;
    return rest;
  });
}

function chooseTemplate(metric: RelationshipMetrics, person: Person) {
  if (metric.valenceScore < 45) {
    return `Share a memory or gratitude note with ${person.name} to lift the tone.`;
  }
  if (metric.recencyScore < 60) {
    return `Send a quick check-in to ${person.name}—a recent win or article they would enjoy.`;
  }
  if (metric.frequencyScore < 50) {
    return `Set up a casual catch-up with ${person.name} to rebuild cadence.`;
  }
  return `Celebrate something ${person.name} recently achieved—photos or highlights keep momentum.`;
}

function buildExplanation(metric: RelationshipMetrics) {
  const reasons: string[] = [];
  if (metric.recencyScore < 70) {
    reasons.push(`Recency dipped to ${metric.recencyScore}.`);
  }
  if (metric.frequencyScore < 60) {
    reasons.push(`Frequency trailing at ${metric.frequencyScore}.`);
  }
  if (metric.valenceScore < 60) {
    reasons.push(`Valence needs attention (${metric.valenceScore}).`);
  }
  if (metric.responsivenessScore < 60) {
    reasons.push(`Responses slowing (${metric.responsivenessScore}).`);
  }
  if (reasons.length === 0) {
    reasons.push("Maintaining momentum keeps things warm.");
  }
  return reasons.join(" ");
}

function buildUpcomingTouches(
  routine: Routine,
  existingTouches: ScheduledTouch[],
  personId?: string
) {
  const horizon = addWeeks(new Date(), 4);
  const touches: ScheduledTouch[] = [];
  let cursor = new Date();
  const existingDates = new Set(
    existingTouches.filter((touch) => touch.routineId === routine.id).map((touch) => touch.date)
  );

  const pushTouch = (date: Date) => {
    const iso = formatISO(date);
    if (existingDates.has(iso)) {
      return;
    }
    touches.push({
      id: crypto.randomUUID(),
      routineId: routine.id,
      personId,
      date: iso,
      note: routine.note,
    });
    existingDates.add(iso);
  };

  while (cursor <= horizon) {
    if (routine.rule.type === "weekly") {
      for (let i = 0; i < routine.rule.count; i += 1) {
        const date = addDays(cursor, i * Math.max(1, Math.floor(7 / (routine.rule.count || 1))));
        if (date <= horizon) {
          pushTouch(date);
        }
      }
      cursor = addWeeks(cursor, 1);
    } else if (routine.rule.type === "monthly") {
      for (let i = 0; i < routine.rule.count; i += 1) {
        const date = addDays(cursor, i * Math.max(7, Math.floor(28 / (routine.rule.count || 1))));
        if (date <= horizon) {
          pushTouch(date);
        }
      }
      cursor = addWeeks(cursor, 4);
    } else {
      cursor = addDays(cursor, Math.max(1, routine.rule.count));
      if (cursor <= horizon) {
        pushTouch(cursor);
      }
    }
  }

  return touches;
}
