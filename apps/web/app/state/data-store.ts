import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type {
  Interaction,
  Person,
  Routine,
  ScheduledTouch,
  Settings,
} from "./types";

interface LinqDbSchema extends DBSchema {
  people: {
    key: string;
    value: Person;
  };
  settings: {
    key: string;
    value: Settings & { id: string };
  };
  routines: {
    key: string;
    value: Routine;
  };
  touches: {
    key: string;
    value: ScheduledTouch;
  };
  interactions: {
    key: string;
    value: Interaction;
    indexes: { "by-person": string };
  };
}

const DB_NAME = "linq-os";
const DB_VERSION = 1;

export async function getDatabase() {
  return openDB<LinqDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("people")) {
        db.createObjectStore("people", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        const settingsStore = db.createObjectStore("settings", { keyPath: "id" });
        settingsStore.put({ id: "singleton", onboardingDone: false });
      }
      if (!db.objectStoreNames.contains("routines")) {
        db.createObjectStore("routines", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("touches")) {
        const touchesStore = db.createObjectStore("touches", { keyPath: "id" });
        touchesStore.createIndex("byRoutine", "routineId", { unique: false });
      }
      if (!db.objectStoreNames.contains("interactions")) {
        const interactionsStore = db.createObjectStore("interactions", { keyPath: "id" });
        interactionsStore.createIndex("by-person", "personId", { unique: false });
      }
    },
  });
}

export async function loadAll(db: IDBPDatabase<LinqDbSchema>) {
  const [people, routines, touches, settingsRecords, interactions] = await Promise.all([
    db.getAll("people"),
    db.getAll("routines"),
    db.getAll("touches"),
    db.getAll("settings"),
    db.getAll("interactions"),
  ]);

  const settings = settingsRecords.find((item) => item.id === "singleton") ?? {
    id: "singleton",
    onboardingDone: false,
  };

  const interactionsByPerson = interactions.reduce<Record<string, Interaction[]>>(
    (acc, interaction) => {
      acc[interaction.personId] = acc[interaction.personId] ?? [];
      acc[interaction.personId]!.push(interaction);
      return acc;
    },
    {}
  );

  const enhancedPeople = people.map((person) => ({
    ...person,
    interactions: interactionsByPerson[person.id] ?? [],
  }));

  return { people: enhancedPeople, routines, touches, settings };
}

export async function persistPerson(db: IDBPDatabase<LinqDbSchema>, person: Person) {
  await db.put("people", person);
}

export async function removePerson(db: IDBPDatabase<LinqDbSchema>, id: string) {
  await Promise.all([
    db.delete("people", id),
    clearPersonInteractions(db, id),
  ]);
}

export async function persistSettings(
  db: IDBPDatabase<LinqDbSchema>,
  settings: Settings
) {
  await db.put("settings", { ...settings, id: "singleton" });
}

export async function persistRoutine(db: IDBPDatabase<LinqDbSchema>, routine: Routine) {
  await db.put("routines", routine);
}

export async function removeRoutine(db: IDBPDatabase<LinqDbSchema>, id: string) {
  await Promise.all([
    db.delete("routines", id),
    deleteRoutineTouches(db, id),
  ]);
}

export async function persistTouch(db: IDBPDatabase<LinqDbSchema>, touch: ScheduledTouch) {
  await db.put("touches", touch);
}

export async function persistTouches(
  db: IDBPDatabase<LinqDbSchema>,
  touches: ScheduledTouch[]
) {
  const tx = db.transaction("touches", "readwrite");
  await Promise.all(touches.map((touch) => tx.store.put(touch)));
  await tx.done;
}

export async function deleteRoutineTouches(db: IDBPDatabase<LinqDbSchema>, routineId: string) {
  const index = db.transaction("touches", "readwrite").store.index("byRoutine");
  let cursor = await index.openCursor(routineId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

export async function persistInteraction(
  db: IDBPDatabase<LinqDbSchema>,
  interaction: Interaction
) {
  await db.put("interactions", interaction);
}

export async function clearPersonInteractions(db: IDBPDatabase<LinqDbSchema>, personId: string) {
  const index = db.transaction("interactions", "readwrite").store.index("by-person");
  let cursor = await index.openCursor(personId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

export async function clearAllData(db: IDBPDatabase<LinqDbSchema>) {
  await Promise.all([
    db.clear("people"),
    db.clear("routines"),
    db.clear("touches"),
    db.clear("interactions"),
    db.put("settings", { id: "singleton", onboardingDone: false }),
  ]);
}
