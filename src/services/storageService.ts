import { DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  AppSettings,
  MistakePattern,
  PracticeAttempt,
  PracticeSession,
} from '../types';

const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  version: 'mathPractice.version',
  settings: 'mathPractice.settings',
  sessions: 'mathPractice.sessions',
  attempts: 'mathPractice.attempts',
  mistakePatterns: 'mathPractice.mistakePatterns',
  statistics: 'mathPractice.statistics',
  activeSession: 'mathPractice.activeSession',
} as const;

export interface StorageResult {
  ok: boolean;
  error?: 'unavailable' | 'capacity' | 'invalid';
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  try {
    target.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    const capacity =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return { ok: false, error: capacity ? 'capacity' : 'unavailable' };
  }
}

function read<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  const target = storage();
  if (!target) return fallback;
  const raw = target.getItem(key);
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (validate(value)) return value;
  } catch {
    // Repair only this category below.
  }
  target.removeItem(key);
  return fallback;
}

function isOperation(value: unknown): boolean {
  return ['addition', 'subtraction', 'multiplication', 'division'].includes(
    String(value),
  );
}

export function isSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AppSettings>;
  return (
    typeof item.soundEffects === 'boolean' &&
    typeof item.cardAnimations === 'boolean' &&
    typeof item.showExplanations === 'boolean' &&
    typeof item.positiveFeedback === 'boolean' &&
    [5, 10, 20, 'continuous'].includes(item.defaultSessionLength ?? 0) &&
    [1, 2, 3, 4].includes(item.defaultDifficulty ?? 0) &&
    Array.isArray(item.defaultOperations) &&
    item.defaultOperations.length > 0 &&
    item.defaultOperations.every(isOperation) &&
    Number.isInteger(item.masteryThreshold) &&
    (item.masteryThreshold ?? 0) >= 1
  );
}

function isAttempt(value: unknown): value is PracticeAttempt {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PracticeAttempt>;
  return (
    typeof item.id === 'string' &&
    typeof item.questionId === 'string' &&
    isOperation(item.operation) &&
    Number.isFinite(item.correctAnswer) &&
    Number.isFinite(item.selectedAnswer) &&
    typeof item.selfReportedCorrect === 'boolean' &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    (item.source === 'regular' || item.source === 'mistake-review') &&
    (item.source === 'regular' || typeof item.mistakePatternId === 'string') &&
    typeof item.sessionId === 'string' &&
    typeof item.attemptedAt === 'string'
  );
}

function isSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PracticeSession>;
  return (
    typeof item.id === 'string' &&
    typeof item.startedAt === 'string' &&
    Array.isArray(item.operations) &&
    item.operations.length > 0 &&
    item.operations.every(isOperation) &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    [5, 10, 20, 'continuous'].includes(item.sessionLength ?? 0) &&
    (item.reviewMode === 'regular' || item.reviewMode === 'mistake-review') &&
    Number.isInteger(item.attempted) &&
    Number.isInteger(item.correct) &&
    Number.isInteger(item.incorrect) &&
    Number.isInteger(item.mistakeReviewCount) &&
    (item.mistakeReviewCount ?? -1) >= 0 &&
    typeof item.isActive === 'boolean'
  );
}

export function isMistakePattern(value: unknown): value is MistakePattern {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MistakePattern>;
  const hasValidShape =
    typeof item.id === 'string' &&
    isOperation(item.operation) &&
    Number.isInteger(item.firstOperand) &&
    (item.firstOperand ?? -1) >= 0 &&
    Number.isInteger(item.secondOperand) &&
    (item.secondOperand ?? -1) >= 0 &&
    Number.isInteger(item.correctAnswer) &&
    (item.correctAnswer ?? -1) >= 0 &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    Number.isInteger(item.incorrectCount) &&
    (item.incorrectCount ?? 0) >= 1 &&
    Number.isInteger(item.similarCorrectCount) &&
    (item.similarCorrectCount ?? -1) >= 0 &&
    Number.isInteger(item.similarAttemptCount) &&
    (item.similarAttemptCount ?? -1) >= 0 &&
    typeof item.lastIncorrectAt === 'string' &&
    !Number.isNaN(Date.parse(item.lastIncorrectAt)) &&
    typeof item.mastered === 'boolean';

  if (!hasValidShape) return false;

  switch (item.operation) {
    case 'addition':
      return item.firstOperand! + item.secondOperand! === item.correctAnswer;
    case 'subtraction':
      return (
        item.firstOperand! >= item.secondOperand! &&
        item.firstOperand! - item.secondOperand! === item.correctAnswer
      );
    case 'multiplication':
      return item.firstOperand! * item.secondOperand! === item.correctAnswer;
    case 'division':
      return (
        item.secondOperand! > 0 &&
        item.firstOperand! / item.secondOperand! === item.correctAnswer
      );
    default:
      return false;
  }
}

export function initializeStorage(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  try {
    if (Number(target.getItem(STORAGE_KEYS.version)) !== SCHEMA_VERSION) {
      target.setItem(STORAGE_KEYS.version, String(SCHEMA_VERSION));
    }
  } catch (error) {
    const capacity =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return { ok: false, error: capacity ? 'capacity' : 'unavailable' };
  }
  return { ok: true };
}

export function loadSettings(): AppSettings {
  initializeStorage();
  return read(STORAGE_KEYS.settings, isSettings, { ...DEFAULT_SETTINGS });
}

export function saveSettings(settings: AppSettings): StorageResult {
  if (!isSettings(settings)) return { ok: false, error: 'invalid' };
  const initialized = initializeStorage();
  if (!initialized.ok) return initialized;
  return write(STORAGE_KEYS.settings, settings);
}

export function loadAttempts(): PracticeAttempt[] {
  initializeStorage();
  return read(
    STORAGE_KEYS.attempts,
    (value): value is PracticeAttempt[] => Array.isArray(value) && value.every(isAttempt),
    [],
  );
}

export function saveAttempt(attempt: PracticeAttempt): StorageResult {
  if (!isAttempt(attempt)) return { ok: false, error: 'invalid' };
  return write(STORAGE_KEYS.attempts, [...loadAttempts(), attempt]);
}

export function loadSessions(): PracticeSession[] {
  initializeStorage();
  return read(
    STORAGE_KEYS.sessions,
    (value): value is PracticeSession[] => Array.isArray(value) && value.every(isSession),
    [],
  );
}

export function saveSession(session: PracticeSession): StorageResult {
  if (!isSession(session)) return { ok: false, error: 'invalid' };
  const existing = loadSessions().filter((item) => item.id !== session.id);
  return write(STORAGE_KEYS.sessions, [session, ...existing].slice(0, 100));
}

export function loadMistakePatterns(): MistakePattern[] {
  initializeStorage();
  return read(
    STORAGE_KEYS.mistakePatterns,
    (value): value is MistakePattern[] =>
      Array.isArray(value) && value.every(isMistakePattern),
    [],
  );
}

export function saveMistakePatterns(patterns: readonly MistakePattern[]): StorageResult {
  if (!patterns.every(isMistakePattern)) return { ok: false, error: 'invalid' };
  return write(STORAGE_KEYS.mistakePatterns, patterns);
}

export function clearPracticeHistory(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  [
    STORAGE_KEYS.attempts,
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.statistics,
    STORAGE_KEYS.mistakePatterns,
  ].forEach((key) => target.removeItem(key));
  return { ok: true };
}

export function clearAllApplicationData(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  Object.values(STORAGE_KEYS).forEach((key) => target.removeItem(key));
  initializeStorage();
  return { ok: true };
}
