export interface Term {
  id: string;
  term: string;
  definition: string;
  masteryScore: 0 | 1 | 2 | 3 | 4;
  lastSeen: string | null;
  timesCorrect: number;
  timesWrong: number;
}

export interface StudySet {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  terms: Term[];
  sessionCount: number;
  lastStudied: string | null;
  ownerId: string | null;
}

export interface StudySession {
  id: string;
  setId: string;
  mode: 'flashcard' | 'learn' | 'test' | 'match';
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  score: number | null;
  termResults: {
    termId: string;
    correct: boolean;
    timeToAnswerMs: number;
  }[];
}

export interface AppSettings {
  theme: 'dark';
  fuzzyMatchEnabled: boolean;
  studyBothSides: boolean;
  learnRoundSize: number;
  firebaseEnabled: boolean;
  userId: string | null;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastStudiedDate: string;
  };
}

export type StudyMode = 'flashcard' | 'learn' | 'test' | 'match';
export type AppView =
  | 'landing'
  | 'dashboard'
  | 'create'
  | 'set-detail'
  | 'flashcard'
  | 'learn'
  | 'test'
  | 'match'
  | 'settings'
  | 'import';
