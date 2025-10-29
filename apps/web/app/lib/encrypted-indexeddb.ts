"use client";

const DB_NAME = "linq-secure";
const STORE_NAME = "vault";
const DB_VERSION = 1;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available on the server.");
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function importKey(passphrase: string) {
  return crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
}

async function deriveAesKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await importKey(passphrase);
  const normalizedSalt = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength,
  ) as ArrayBuffer;
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: normalizedSalt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(value: unknown, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(value)),
  );

  return {
    salt: Array.from(salt),
    iv: Array.from(iv),
    payload: Array.from(new Uint8Array(cipher)),
  } satisfies EncryptedPayload;
}

async function decrypt(payload: EncryptedPayload, passphrase: string) {
  const salt = new Uint8Array(payload.salt);
  const iv = new Uint8Array(payload.iv);
  const key = await deriveAesKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(payload.payload),
  );
  return JSON.parse(decoder.decode(decrypted));
}

export interface EncryptedPayload {
  salt: number[];
  iv: number[];
  payload: number[];
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => Promise<T>) {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    handler(store)
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
      .catch((error) => reject(error));
  });
}

export async function setEncryptedItem(key: string, value: unknown, passphrase: string) {
  const payload = await encrypt(value, passphrase);
  return withStore("readwrite", async (store) => {
    store.put(payload, key);
  });
}

export async function getEncryptedItem<T>(key: string, passphrase: string): Promise<T | undefined> {
  return withStore("readonly", async (store) => {
    return new Promise<T | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (!request.result) {
          resolve(undefined);
          return;
        }
        try {
          const value = await decrypt(request.result as EncryptedPayload, passphrase);
          resolve(value as T);
        } catch (error) {
          reject(error);
        }
      };
    });
  });
}

export async function deleteEncryptedItem(key: string) {
  return withStore("readwrite", async (store) => {
    store.delete(key);
  });
}

export async function clearEncryptedStore() {
  return withStore("readwrite", async (store) => {
    store.clear();
  });
}

export async function exportEncryptedData() {
  return withStore("readonly", async (store) => {
    return new Promise<Record<string, EncryptedPayload>>((resolve, reject) => {
      const result: Record<string, EncryptedPayload> = {};
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(result);
          return;
        }
        result[String(cursor.key)] = cursor.value as EncryptedPayload;
        cursor.continue();
      };
    });
  });
}

export async function importEncryptedData(snapshot: Record<string, EncryptedPayload>) {
  return withStore("readwrite", async (store) => {
    Object.entries(snapshot).forEach(([key, value]) => {
      store.put(value, key);
    });
  });
}
