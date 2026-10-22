import { beforeEach, describe, expect, it } from 'vitest';
import type { MistakePattern, PracticeAttempt } from '../types';
import { loadMistakePatterns } from './storageService';
import {
  mistakePatternKey,
  recordMistakeForAttempt,
  updateMistakePatterns,
} from './mistakeService';

function makeAttempt(overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id: 'attempt-1',
    questionId: 'question-1',
    operation: 'subtraction',
    firstOperand: 9,
    secondOperand: 4,
    correctAnswer: 5,
    selectedAnswer: 4,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: '2026-10-21T20:00:00.000Z',
    sessionId: 'session-1',
    ...overrides,
  };
}

describe('mistake tracking', () => {
  beforeEach(() => localStorage.clear());

  it('creates and persists a complete pattern after a self-reported mistake', () => {
    const attempt = makeAttempt();
    expect(recordMistakeForAttempt(attempt)).toEqual({ ok: true });
    expect(loadMistakePatterns()).toEqual([
      expect.objectContaining({
        operation: 'subtraction',
        firstOperand: 9,
        secondOperand: 4,
        correctAnswer: 5,
        difficulty: 2,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: attempt.attemptedAt,
        mastered: false,
      }),
    ]);
  });

  it('updates one existing pattern and resets mastery progress', () => {
    const first = updateMistakePatterns([], makeAttempt());
    const mastered: MistakePattern[] = [
      { ...first[0], similarCorrectCount: 3, similarAttemptCount: 3, mastered: true },
    ];
    const updated = updateMistakePatterns(
      mastered,
      makeAttempt({ id: 'attempt-2', attemptedAt: '2026-10-21T21:00:00.000Z' }),
    );
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      similarAttemptCount: 3,
      lastIncorrectAt: '2026-10-21T21:00:00.000Z',
      mastered: false,
    });
  });

  it('does not create patterns from self-reported correct attempts', () => {
    expect(updateMistakePatterns([], makeAttempt({ selfReportedCorrect: true }))).toEqual(
      [],
    );
  });

  it('merges reversed commutative facts but preserves subtraction and division order', () => {
    const additionA = makeAttempt({
      operation: 'addition',
      firstOperand: 3,
      secondOperand: 8,
      correctAnswer: 11,
    });
    const additionB = makeAttempt({
      operation: 'addition',
      firstOperand: 8,
      secondOperand: 3,
      correctAnswer: 11,
    });
    expect(mistakePatternKey(additionA)).toBe(mistakePatternKey(additionB));

    const subtractionA = makeAttempt({ firstOperand: 9, secondOperand: 4 });
    const subtractionB = makeAttempt({ firstOperand: 4, secondOperand: 9 });
    expect(mistakePatternKey(subtractionA)).not.toBe(mistakePatternKey(subtractionB));

    const divisionA = makeAttempt({
      operation: 'division',
      firstOperand: 12,
      secondOperand: 3,
      correctAnswer: 4,
    });
    const divisionB = makeAttempt({
      operation: 'division',
      firstOperand: 3,
      secondOperand: 12,
      correctAnswer: 0.25,
    });
    expect(mistakePatternKey(divisionA)).not.toBe(mistakePatternKey(divisionB));
  });
});
