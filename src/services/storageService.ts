import { DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  ActivePracticeSession,
  AppSettings,
  MistakePattern,
  PracticeAttempt,
  PracticeSession,
  Question,
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

export type StorageCategory =
  'settings' | 'attempts' | 'sessions' | 'mistake patterns' | 'active session';

export interface StorageRecoveryNotice {
  category: StorageCategory | 'browser storage';
  message: string;
}

const recoveryNotices = new Map<StorageRecoveryNotice['category'], string>();

function recordRecoveryNotice(
  category: StorageRecoveryNotice['category'],
  message: string,
) {
  recoveryNotices.set(category, message);
}

export function getStorageRecoveryNotices(): StorageRecoveryNotice[] {
  return Array.from(recoveryNotices, ([category, message]) => ({ category, message }));
}

export function clearStorageRecoveryNotices() {
  recoveryNotices.clear();
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    recordRecoveryNotice(
      'browser storage',
      'This browser is not allowing saved progress right now. You can still practice, but keep this tab open.',
    );
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
    const reason = capacity ? 'capacity' : 'unavailable';
    recordRecoveryNotice(
      'browser storage',
      capacity
        ? 'This browser is out of space for Math Quest progress. Your current screen still works, but new progress may not be saved.'
        : 'This browser is not allowing saved progress right now. You can still practice, but keep this tab open.',
    );
    return { ok: false, error: reason };
  }
}

function read<T>(
  key: string,
  category: StorageCategory,
  validate: (value: unknown) => value is T,
  fallback: T,
): T {
  const target = storage();
  if (!target) return fallback;
  let raw: string | null;
  try {
    raw = target.getItem(key);
  } catch {
    recordRecoveryNotice(
      'browser storage',
      'This browser is not allowing saved progress right now. You can still practice, but keep this tab open.',
    );
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (validate(value)) return value;
  } catch {
    // Remove only this invalid category below.
  }
  try {
    target.removeItem(key);
  } catch {
    recordRecoveryNotice(
      'browser storage',
      'This browser is not allowing saved progress right now. You can still practice, but keep this tab open.',
    );
    return fallback;
  }
  recordRecoveryNotice(
    category,
    `We found a problem with saved ${category}, so we reset only that part. Your other Math Quest data is still here.`,
  );
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
    new Set(item.defaultOperations).size === item.defaultOperations.length &&
    Number.isInteger(item.masteryThreshold) &&
    (item.masteryThreshold ?? 0) >= 1 &&
    (item.masteryThreshold ?? 11) <= 10
  );
}

function isAttempt(value: unknown): value is PracticeAttempt {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PracticeAttempt>;
  return (
    typeof item.id === 'string' &&
    typeof item.questionId === 'string' &&
    isOperation(item.operation) &&
    Number.isInteger(item.firstOperand) &&
    (item.firstOperand ?? -1) >= 0 &&
    Number.isInteger(item.secondOperand) &&
    (item.secondOperand ?? -1) >= 0 &&
    Number.isInteger(item.correctAnswer) &&
    (item.correctAnswer ?? -1) >= 0 &&
    Number.isInteger(item.selectedAnswer) &&
    (item.selectedAnswer ?? -1) >= 0 &&
    typeof item.selfReportedCorrect === 'boolean' &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    (item.source === 'regular' || item.source === 'mistake-review') &&
    (item.source === 'regular' || typeof item.mistakePatternId === 'string') &&
    typeof item.sessionId === 'string' &&
    typeof item.attemptedAt === 'string' &&
    !Number.isNaN(Date.parse(item.attemptedAt)) &&
    ((item.operation === 'addition' &&
      item.firstOperand! + item.secondOperand! === item.correctAnswer) ||
      (item.operation === 'subtraction' &&
        item.firstOperand! >= item.secondOperand! &&
        item.firstOperand! - item.secondOperand! === item.correctAnswer) ||
      (item.operation === 'multiplication' &&
        item.firstOperand! * item.secondOperand! === item.correctAnswer) ||
      (item.operation === 'division' &&
        item.secondOperand! > 0 &&
        item.firstOperand! / item.secondOperand! === item.correctAnswer))
  );
}

function isSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PracticeSession>;
  return (
    typeof item.id === 'string' &&
    typeof item.startedAt === 'string' &&
    !Number.isNaN(Date.parse(item.startedAt)) &&
    Array.isArray(item.operations) &&
    item.operations.length > 0 &&
    item.operations.every(isOperation) &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    [5, 10, 20, 'continuous'].includes(item.sessionLength ?? 0) &&
    (item.reviewMode === 'regular' || item.reviewMode === 'mistake-review') &&
    Number.isInteger(item.attempted) &&
    (item.attempted ?? -1) >= 0 &&
    Number.isInteger(item.correct) &&
    (item.correct ?? -1) >= 0 &&
    Number.isInteger(item.incorrect) &&
    (item.incorrect ?? -1) >= 0 &&
    Number.isInteger(item.mistakeReviewCount) &&
    (item.mistakeReviewCount ?? -1) >= 0 &&
    (item.mistakeReviewCount ?? 1) <= (item.attempted ?? 0) &&
    (item.correct ?? 0) + (item.incorrect ?? 0) === item.attempted &&
    typeof item.isActive === 'boolean' &&
    (item.completedAt === undefined ||
      (typeof item.completedAt === 'string' &&
        !Number.isNaN(Date.parse(item.completedAt)))) &&
    (item.isActive || typeof item.completedAt === 'string')
  );
}

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Question>;
  const choices = item.choices;
  const hasValidShape =
    typeof item.id === 'string' &&
    isOperation(item.operation) &&
    Number.isInteger(item.firstOperand) &&
    Number.isInteger(item.secondOperand) &&
    typeof item.displayText === 'string' &&
    Number.isInteger(item.correctAnswer) &&
    Array.isArray(choices) &&
    choices.length === 4 &&
    choices.every(Number.isInteger) &&
    new Set(choices).size === 4 &&
    choices.includes(item.correctAnswer as number) &&
    [1, 2, 3, 4].includes(item.difficulty ?? 0) &&
    (item.source === 'regular' || item.source === 'mistake-review') &&
    (item.source === 'regular' || typeof item.mistakePatternId === 'string');

  if (!hasValidShape) return false;
  switch (item.operation) {
    case 'addition':
      return item.firstOperand! + item.secondOperand! === item.correctAnswer;
    case 'subtraction':
      return item.firstOperand! - item.secondOperand! === item.correctAnswer;
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

function isActivePracticeSession(value: unknown): value is ActivePracticeSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ActivePracticeSession>;
  const configuration = item.configuration;
  if (!configuration || typeof configuration !== 'object') return false;
  const validConfiguration =
    Array.isArray(configuration.operations) &&
    configuration.operations.length > 0 &&
    configuration.operations.every(isOperation) &&
    [1, 2, 3, 4].includes(configuration.difficulty ?? 0) &&
    [5, 10, 20, 'continuous'].includes(configuration.sessionLength ?? 0) &&
    (configuration.reviewMode === 'regular' ||
      configuration.reviewMode === 'mistake-review');
  if (
    !validConfiguration ||
    !isSession(item.session) ||
    !item.session.isActive ||
    !isQuestion(item.question) ||
    !Array.isArray(item.attempts) ||
    !item.attempts.every(isAttempt)
  ) {
    return false;
  }

  const countsMatch =
    item.session.attempted === item.attempts.length &&
    item.session.correct ===
      item.attempts.filter((attempt) => attempt.selfReportedCorrect).length &&
    item.session.incorrect ===
      item.attempts.filter((attempt) => !attempt.selfReportedCorrect).length;
  const sessionMatches =
    item.session.difficulty === configuration.difficulty &&
    item.session.sessionLength === configuration.sessionLength &&
    item.session.reviewMode === configuration.reviewMode &&
    item.question.difficulty === configuration.difficulty &&
    configuration.operations.includes(item.question.operation) &&
    item.attempts.every((attempt) => attempt.sessionId === item.session!.id);
  const selectedAnswerIsValid =
    item.selectedAnswer === null ||
    (typeof item.selectedAnswer === 'number' &&
      Number.isInteger(item.selectedAnswer) &&
      item.question.choices.includes(item.selectedAnswer));

  return (
    countsMatch &&
    sessionMatches &&
    selectedAnswerIsValid &&
    typeof item.isCardFlipped === 'boolean' &&
    (!item.isCardFlipped || item.selectedAnswer !== null)
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
    recordRecoveryNotice(
      'browser storage',
      capacity
        ? 'This browser is out of space for Math Quest progress. Your current screen still works, but new progress may not be saved.'
        : 'This browser is not allowing saved progress right now. You can still practice, but keep this tab open.',
    );
    return { ok: false, error: capacity ? 'capacity' : 'unavailable' };
  }
  return { ok: true };
}

export function loadSettings(): AppSettings {
  initializeStorage();
  return read(STORAGE_KEYS.settings, 'settings', isSettings, { ...DEFAULT_SETTINGS });
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
    'attempts',
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
    'sessions',
    (value): value is PracticeSession[] => Array.isArray(value) && value.every(isSession),
    [],
  );
}

export function saveSession(session: PracticeSession): StorageResult {
  if (!isSession(session)) return { ok: false, error: 'invalid' };
  const existing = loadSessions().filter((item) => item.id !== session.id);
  return write(STORAGE_KEYS.sessions, [session, ...existing].slice(0, 100));
}

export function loadActiveSession(): ActivePracticeSession | null {
  initializeStorage();
  return read(
    STORAGE_KEYS.activeSession,
    'active session',
    isActivePracticeSession,
    null as ActivePracticeSession | null,
  );
}

export function saveActiveSession(activeSession: ActivePracticeSession): StorageResult {
  if (!isActivePracticeSession(activeSession)) {
    return { ok: false, error: 'invalid' };
  }
  return write(STORAGE_KEYS.activeSession, activeSession);
}

export function clearActiveSession(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  try {
    target.removeItem(STORAGE_KEYS.activeSession);
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export function loadMistakePatterns(): MistakePattern[] {
  initializeStorage();
  return read(
    STORAGE_KEYS.mistakePatterns,
    'mistake patterns',
    (value): value is MistakePattern[] =>
      Array.isArray(value) && value.every(isMistakePattern),
    [],
  );
}

export function validateStoredData(): StorageRecoveryNotice[] {
  loadSettings();
  loadAttempts();
  loadSessions();
  loadMistakePatterns();
  loadActiveSession();
  return getStorageRecoveryNotices();
}

export function saveMistakePatterns(patterns: readonly MistakePattern[]): StorageResult {
  if (!patterns.every(isMistakePattern)) return { ok: false, error: 'invalid' };
  return write(STORAGE_KEYS.mistakePatterns, patterns);
}

export function clearPracticeHistory(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  try {
    [
      STORAGE_KEYS.attempts,
      STORAGE_KEYS.sessions,
      STORAGE_KEYS.statistics,
      STORAGE_KEYS.mistakePatterns,
    ].forEach((key) => target.removeItem(key));
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export function clearAllApplicationData(): StorageResult {
  const target = storage();
  if (!target) return { ok: false, error: 'unavailable' };
  try {
    Object.values(STORAGE_KEYS).forEach((key) => target.removeItem(key));
    initializeStorage();
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
