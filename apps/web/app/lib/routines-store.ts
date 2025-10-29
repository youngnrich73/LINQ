"use client";

import { getEncryptedItem, setEncryptedItem } from "./encrypted-indexeddb";
import type { Routine, RoutineScheduleItem } from "./types";

const ROUTINE_KEY = "routines";
const SCHEDULE_KEY = "schedule";
const PASSPHRASE = "linq-default-passphrase";

const randomId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export async function loadRoutines(): Promise<Routine[]> {
  return (await getEncryptedItem<Routine[]>(ROUTINE_KEY, PASSPHRASE)) ?? [];
}

export async function saveRoutine(routine: Routine) {
  const routines = await loadRoutines();
  const existingIndex = routines.findIndex((entry) => entry.id === routine.id);
  if (existingIndex >= 0) {
    routines[existingIndex] = routine;
  } else {
    routines.push(routine);
  }
  await setEncryptedItem(ROUTINE_KEY, routines, PASSPHRASE);
  return routines;
}

export async function removeRoutine(id: string) {
  const routines = await loadRoutines();
  const filtered = routines.filter((routine) => routine.id !== id);
  await setEncryptedItem(ROUTINE_KEY, filtered, PASSPHRASE);
  const schedule = await loadSchedule();
  const pruned = schedule.filter((item) => item.routineId !== id);
  await setEncryptedItem(SCHEDULE_KEY, pruned, PASSPHRASE);
  return filtered;
}

export async function loadSchedule(): Promise<RoutineScheduleItem[]> {
  return (await getEncryptedItem<RoutineScheduleItem[]>(SCHEDULE_KEY, PASSPHRASE)) ?? [];
}

export async function upsertScheduleItems(items: RoutineScheduleItem[]) {
  await setEncryptedItem(SCHEDULE_KEY, items, PASSPHRASE);
  return items;
}

export function createScheduleEntries(routine: Routine, weeks = 4) {
  const occurrences: RoutineScheduleItem[] = [];
  const now = new Date();
  for (let index = 0; index < weeks; index += 1) {
    const scheduled = new Date(now);
    switch (routine.cadence) {
      case "daily":
        scheduled.setDate(now.getDate() + index);
        break;
      case "weekly":
        scheduled.setDate(now.getDate() + index * 7);
        break;
      case "biweekly":
        scheduled.setDate(now.getDate() + index * 14);
        break;
      case "monthly":
        scheduled.setMonth(now.getMonth() + index);
        break;
      default:
        break;
    }
    if (routine.preferredDay !== undefined && routine.cadence !== "daily") {
      scheduled.setDate(
        scheduled.getDate() + ((routine.preferredDay - scheduled.getDay() + 7) % 7),
      );
    }
    occurrences.push({
      id: randomId(),
      routineId: routine.id,
      scheduledAt: scheduled.toISOString(),
      completed: false,
    });
  }
  return occurrences;
}

export async function markRoutineComplete(routineId: string, occurrenceId: string) {
  const routines = await loadRoutines();
  const routine = routines.find((entry) => entry.id === routineId);
  if (routine) {
    routine.lastCompletedAt = new Date().toISOString();
    await setEncryptedItem(ROUTINE_KEY, routines, PASSPHRASE);
  }

  const schedule = await loadSchedule();
  const updated = schedule.map((item) =>
    item.id === occurrenceId ? { ...item, completed: true } : item,
  );
  await setEncryptedItem(SCHEDULE_KEY, updated, PASSPHRASE);
  return { routines, schedule: updated };
}

export async function resetEncryptedData() {
  await setEncryptedItem(ROUTINE_KEY, [], PASSPHRASE);
  await setEncryptedItem(SCHEDULE_KEY, [], PASSPHRASE);
}

export function createEmptyRoutine(): Routine {
  return {
    id: randomId(),
    name: "",
    cadence: "weekly",
  };
}
