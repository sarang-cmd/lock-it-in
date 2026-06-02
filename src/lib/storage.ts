import { StudySet, StudySession, AppSettings } from '../types';

const DB_NAME = 'lockitin_db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sets')) {
        const setsStore = db.createObjectStore('sets', { keyPath: 'id' });
        setsStore.createIndex('name', 'name', { unique: false });
        setsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionsStore.createIndex('setId', 'setId', { unique: false });
        sessionsStore.createIndex('startedAt', 'startedAt', { unique: false });
      }
    };
  });
}

function idbGet<T>(store: string, key: string): Promise<T | null> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  }));
}

function idbGetAll<T>(store: string): Promise<T[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function idbPut(store: string, value: unknown): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function idbGetByIndex<T>(store: string, indexName: string, value: string): Promise<T[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const index = tx.objectStore(store).index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export const db = {
  sets: {
    getAll: (): Promise<StudySet[]> => idbGetAll<StudySet>('sets'),
    getById: (id: string): Promise<StudySet | null> => idbGet<StudySet>('sets', id),
    create: (set: StudySet): Promise<void> => idbPut('sets', set),
    update: (set: StudySet): Promise<void> => idbPut('sets', set),
    delete: (id: string): Promise<void> => idbDelete('sets', id),
  },
  sessions: {
    getBySetId: (setId: string): Promise<StudySession[]> =>
      idbGetByIndex<StudySession>('sessions', 'setId', setId),
    create: (session: StudySession): Promise<void> => idbPut('sessions', session),
  },
  export: {
    toJSON: async (setId: string): Promise<string> => {
      const set = await idbGet<StudySet>('sets', setId);
      if (!set) throw new Error('Set not found');
      return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        set,
      }, null, 2);
    },
    allToJSON: async (): Promise<string> => {
      const sets = await idbGetAll<StudySet>('sets');
      return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        sets,
      }, null, 2);
    },
    fromJSON: async (json: string): Promise<void> => {
      const data = JSON.parse(json);
      if (data.set) {
        await idbPut('sets', data.set);
      } else if (data.sets) {
        for (const set of data.sets) {
          await idbPut('sets', set);
        }
      }
    },
  },
};

const SETTINGS_KEY = 'lii_settings';

const defaultSettings: AppSettings = {
  theme: 'dark',
  fuzzyMatchEnabled: true,
  studyBothSides: false,
  learnRoundSize: 7,
  firebaseEnabled: false,
  userId: null,
  streakData: {
    currentStreak: 0,
    longestStreak: 0,
    lastStudiedDate: '',
  },
};

export const settingsStorage = {
  get: (): AppSettings => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return defaultSettings;
    }
  },
  set: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  update: (partial: Partial<AppSettings>): AppSettings => {
    const current = settingsStorage.get();
    const updated = { ...current, ...partial };
    settingsStorage.set(updated);
    return updated;
  },
};

export function updateStreak(settings: AppSettings): AppSettings {
  const today = new Date().toDateString();
  const last = settings.streakData.lastStudiedDate;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let { currentStreak, longestStreak } = settings.streakData;

  if (last === today) {
    // already studied today
  } else if (last === yesterday) {
    currentStreak += 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  } else if (last !== today) {
    currentStreak = 1;
  }

  return settingsStorage.update({
    streakData: { currentStreak, longestStreak, lastStudiedDate: today },
  });
}
