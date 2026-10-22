import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import type { PracticeAttempt, PracticeSession } from '../types';
import {
  STORAGE_KEYS,
  initializeStorage,
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  loadSettings,
  saveAttempt,
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

describe('storageService', () => {
  beforeEach(() => localStorage.clear());

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

  it('repairs only a corrupt category', () => {
    saveAttempt(attempt);
    localStorage.setItem(STORAGE_KEYS.settings, '{bad');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadAttempts()).toEqual([attempt]);
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull();
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
  });

  it('returns a capacity error rather than throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(saveSettings(DEFAULT_SETTINGS)).toEqual({ ok: false, error: 'capacity' });
    vi.restoreAllMocks();
  });
});
