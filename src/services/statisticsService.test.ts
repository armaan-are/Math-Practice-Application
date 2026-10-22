import { describe, expect, it } from 'vitest';
import type { PracticeAttempt } from '../types';
import { accuracy, calculateStatistics } from './statisticsService';

const attempts: PracticeAttempt[] = [
  {
    id: '1',
    questionId: 'q1',
    operation: 'addition',
    firstOperand: 1,
    secondOperand: 2,
    correctAnswer: 3,
    selectedAnswer: 3,
    selfReportedCorrect: true,
    difficulty: 1,
    source: 'regular',
    attemptedAt: '2026-10-21T20:00:00Z',
    sessionId: 's1',
  },
  {
    id: '2',
    questionId: 'q2',
    operation: 'division',
    firstOperand: 8,
    secondOperand: 2,
    correctAnswer: 4,
    selectedAnswer: 3,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: '2026-10-21T20:01:00Z',
    sessionId: 's1',
  },
];

describe('statisticsService', () => {
  it('calculates overall, operation, and difficulty totals', () => {
    const result = calculateStatistics(attempts);
    expect(result).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 });
    expect(result.byOperation.addition).toEqual({
      attempted: 1,
      correct: 1,
      incorrect: 0,
    });
    expect(result.byOperation.division).toEqual({
      attempted: 1,
      correct: 0,
      incorrect: 1,
    });
    expect(result.byDifficulty[1].correct).toBe(1);
    expect(result.byDifficulty[2].incorrect).toBe(1);
    expect(accuracy(result)).toBe(50);
  });

  it('returns zero accuracy when no questions exist', () => {
    expect(accuracy(calculateStatistics([]))).toBe(0);
  });
});
