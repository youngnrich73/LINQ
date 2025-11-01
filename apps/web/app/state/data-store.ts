import type {
  Interaction,
  Person,
  Routine,
  ScheduledTouch,
  Settings,
} from "./types";

type SettingsRecord = Settings & { id: string };

type StoreMap = {
  people: Person[];
  settings: SettingsRecord[];
  routines: Routine[];
  touches: ScheduledTouch[];
  interactions: Interaction[];
};

type StoreName = keyof StoreMap;
type StoreItem<K extends StoreName> = StoreMap[K] extends Array<infer Item> ? Item : never;

interface IdentifiedRecord {
  id: string;
}

const STORAGE_KEY = "linq-os";

let memorySnapshot: StoreMap | null = null;

function createDefaultSnapshot(): StoreMap {
  return {
    people: [],
    settings: [{ id: "singleton", onboardingDone: true }],
    routines: [],
    touches: [],
    interactions: [],
  };
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value as T;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function readSnapshot(): StoreMap {
  if (typeof window === "undefined") {
    if (!memorySnapshot) {
      memorySnapshot = createDefaultSnapshot();
    }
    return clone(memorySnapshot);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const snapshot = createDefaultSnapshot();
      memorySnapshot = clone(snapshot);
      return snapshot;
    }
    const parsed = JSON.parse(raw) as StoreMap;
    if (!parsed.settings || parsed.settings.length === 0) {
      parsed.settings = [{ id: "singleton", onboardingDone: true }];
    }
    memorySnapshot = clone(parsed);
    return parsed;
  } catch {
    const snapshot = createDefaultSnapshot();
    memorySnapshot = clone(snapshot);
    return snapshot;
  }
}

function writeSnapshot(snapshot: StoreMap) {
  memorySnapshot = clone(snapshot);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memorySnapshot));
    } catch {
      // Ignore storage write errors (e.g., private browsing)
    }
  }
}

class LocalDatabase {
  private snapshot: StoreMap;

  constructor(initialSnapshot: StoreMap) {
    this.snapshot = clone(initialSnapshot);
  }

  private persist() {
    writeSnapshot(this.snapshot);
  }

  async getAll<K extends StoreName>(store: K): Promise<StoreMap[K]> {
    return clone(this.snapshot[store]);
  }

  async put<K extends StoreName>(store: K, value: StoreItem<K>): Promise<void> {
    const list = [...(this.snapshot[store] as StoreItem<K>[])];
    const record = value as StoreItem<K> & IdentifiedRecord;
    const id = record.id;
    if (!id) {
      throw new Error(`Cannot put into ${store.toString()} without an id field`);
    }
    const clonedValue = clone(record) as StoreItem<K>;
    const index = list.findIndex((item) => (item as IdentifiedRecord).id === id);
    if (index >= 0) {
      list[index] = clonedValue;
    } else {
      list.push(clonedValue);
    }
    this.snapshot[store] = list as StoreMap[K];
    this.persist();
  }

  async delete<K extends StoreName>(store: K, key: string): Promise<void> {
    const list = (this.snapshot[store] as StoreItem<K>[]).filter(
      (item) => (item as IdentifiedRecord).id !== key
    );
    this.snapshot[store] = clone(list) as StoreMap[K];
    this.persist();
  }

  async clear<K extends StoreName>(store: K): Promise<void> {
    this.snapshot[store] = [] as StoreMap[K];
    this.persist();
  }

  async replace<K extends StoreName>(store: K, values: StoreMap[K]): Promise<void> {
    this.snapshot[store] = clone(values);
    this.persist();
  }
}

let dbPromise: Promise<LocalDatabase> | null = null;

export async function getDatabase(): Promise<LocalDatabase> {
  if (!dbPromise) {
    const snapshot = readSnapshot();
    dbPromise = Promise.resolve(new LocalDatabase(snapshot));
  }
  return dbPromise;
}

export async function loadAll(db: LocalDatabase) {
  const [people, routines, touches, settingsRecords, interactions] = await Promise.all([
    db.getAll("people"),
    db.getAll("routines"),
    db.getAll("touches"),
    db.getAll("settings"),
    db.getAll("interactions"),
  ]);

  const settings =
    settingsRecords.find((item) => item.id === "singleton") ?? ({
      id: "singleton",
      onboardingDone: true,
    } as SettingsRecord);

  if (!settingsRecords.find((item) => item.id === "singleton")) {
    await db.put("settings", settings);
  }

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

export async function persistPerson(db: LocalDatabase, person: Person) {
  await db.put("people", person);
}

export async function removePerson(db: LocalDatabase, id: string) {
  await db.delete("people", id);
  await clearPersonInteractions(db, id);
}

export async function persistSettings(db: LocalDatabase, settings: Settings) {
  await db.put("settings", { ...settings, id: "singleton" });
}

export async function persistRoutine(db: LocalDatabase, routine: Routine) {
  await db.put("routines", routine);
}

export async function removeRoutine(db: LocalDatabase, id: string) {
  await db.delete("routines", id);
  await deleteRoutineTouches(db, id);
}

export async function persistTouch(db: LocalDatabase, touch: ScheduledTouch) {
  await db.put("touches", touch);
}

export async function persistTouches(db: LocalDatabase, touches: ScheduledTouch[]) {
  const existing = await db.getAll("touches");
  const merged = new Map(existing.map((touch) => [touch.id, touch]));
  for (const touch of touches) {
    merged.set(touch.id, touch);
  }
  await db.replace("touches", Array.from(merged.values()));
}

export async function deleteRoutineTouches(db: LocalDatabase, routineId: string) {
  const remaining = (await db.getAll("touches")).filter((touch) => touch.routineId !== routineId);
  await db.replace("touches", remaining);
}

export async function persistInteraction(db: LocalDatabase, interaction: Interaction) {
  await db.put("interactions", interaction);
}

export async function clearPersonInteractions(db: LocalDatabase, personId: string) {
  const remaining = (await db.getAll("interactions")).filter((interaction) => interaction.personId !== personId);
  await db.replace("interactions", remaining);
}

export async function clearAllData(db: LocalDatabase) {
  await Promise.all([
    db.replace("people", []),
    db.replace("routines", []),
    db.replace("touches", []),
    db.replace("interactions", []),
  ]);
  await db.put("settings", { id: "singleton", onboardingDone: true });
}
