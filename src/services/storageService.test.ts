import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import type { ActivePracticeSession, PracticeAttempt, PracticeSession } from '../types';
import {
  STORAGE_KEYS,
  clearActiveSession,
  clearStorageRecoveryNotices,
  getStorageRecoveryNotices,
  initializeStorage,
  loadActiveSession,
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  loadSettings,
  saveAttempt,
  saveActiveSession,
  saveSession,
  saveSettings,
} from './storageService';

const attempt: PracticeAttempt = {
  id: 'a1',
  questionId: 'q1',
  operation: 'addition',
  firstOperand: 2,
  secondOperand: 3,
  correctAnswer: 5,
  selectedAnswer: 5,
  selfReportedCorrect: true,
  difficulty: 1,
  source: 'regular',
  attemptedAt: '2026-10-21T20:00:00.000Z',
  sessionId: 's1',
};
const session: PracticeSession = {
  id: 's1',
  startedAt: '2026-10-21T20:00:00.000Z',
  completedAt: '2026-10-21T20:01:00.000Z',
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 5,
  reviewMode: 'regular',
  attempted: 1,
  correct: 1,
  incorrect: 0,
  mistakeReviewCount: 0,
  isActive: false,
};
const activeSession: ActivePracticeSession = {
  configuration: {
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
    reviewMode: 'regular',
  },
  session: {
    ...session,
    completedAt: undefined,
    isActive: true,
  },
  question: {
    id: 'q2',
    operation: 'addition',
    firstOperand: 4,
    secondOperand: 3,
    displayText: '4 + 3 = ?',
    correctAnswer: 7,
    choices: [6, 7, 8, 9],
    difficulty: 1,
    source: 'regular',
  },
  attempts: [attempt],
  selectedAnswer: 7,
  isCardFlipped: true,
};

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStorageRecoveryNotices();
  });

  it('versions app data without deleting unrelated keys', () => {
    localStorage.setItem('another.app', 'keep');
    expect(initializeStorage().ok).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.version)).toBe('1');
    expect(localStorage.getItem('another.app')).toBe('keep');
  });

  it('persists settings, attempts, and sessions across later reads', () => {
    const settings = { ...DEFAULT_SETTINGS, soundEffects: false, masteryThreshold: 4 };
    saveSettings(settings);
    saveAttempt(attempt);
    saveSession(session);
    expect(loadSettings()).toEqual(settings);
    expect(loadAttempts()).toEqual([attempt]);
    expect(loadSessions()).toEqual([session]);
  });

  it('validates, restores, and clears an active session snapshot', () => {
    expect(saveActiveSession(activeSession)).toEqual({ ok: true });
    expect(loadActiveSession()).toEqual(activeSession);
    expect(clearActiveSession()).toEqual({ ok: true });
    expect(loadActiveSession()).toBeNull();
  });

  it('rejects inconsistent active session snapshots and repairs corrupt data', () => {
    expect(
      saveActiveSession({
        ...activeSession,
        selectedAnswer: 999,
      }),
    ).toEqual({ ok: false, error: 'invalid' });
    localStorage.setItem(STORAGE_KEYS.activeSession, '{bad');
    expect(loadActiveSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull();
  });

  it('repairs only a corrupt category', () => {
    saveAttempt(attempt);
    localStorage.setItem(STORAGE_KEYS.settings, '{bad');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadAttempts()).toEqual([attempt]);
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull();
    expect(getStorageRecoveryNotices()).toEqual([
      expect.objectContaining({ category: 'settings' }),
    ]);
  });

  it('detects invalid attempts and preserves valid sessions', () => {
    saveSession(session);
    localStorage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([{ ...attempt, correctAnswer: 999 }]),
    );
    expect(loadAttempts()).toEqual([]);
    expect(loadSessions()).toEqual([session]);
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull();
    expect(getStorageRecoveryNotices()).toEqual([
      expect.objectContaining({ category: 'attempts' }),
    ]);
  });

  it('detects invalid sessions and preserves valid attempts', () => {
    saveAttempt(attempt);
    localStorage.setItem(
      STORAGE_KEYS.sessions,
      JSON.stringify([{ ...session, attempted: 2 }]),
    );
    expect(loadSessions()).toEqual([]);
    expect(loadAttempts()).toEqual([attempt]);
    expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBeNull();
    expect(getStorageRecoveryNotices()).toEqual([
      expect.objectContaining({ category: 'sessions' }),
    ]);
  });

  it('validates mistake patterns and removes corrupt mistake data only', () => {
    saveAttempt(attempt);
    localStorage.setItem(
      STORAGE_KEYS.mistakePatterns,
      JSON.stringify([{ operation: 'division', secondOperand: 0 }]),
    );
    expect(loadMistakePatterns()).toEqual([]);
    expect(loadAttempts()).toEqual([attempt]);
    expect(localStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBeNull();
    expect(getStorageRecoveryNotices()).toEqual([
      expect.objectContaining({ category: 'mistake patterns' }),
    ]);
  });

  it('returns a capacity error rather than throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(saveSettings(DEFAULT_SETTINGS)).toEqual({ ok: false, error: 'capacity' });
    vi.restoreAllMocks();
  });
});
