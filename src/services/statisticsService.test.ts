import { describe, expect, it } from 'vitest';
import type { MistakePattern, PracticeAttempt } from '../types';
import {
  accuracy,
  calculateMistakeReviewStatistics,
  calculateStatistics,
} from './statisticsService';

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

  it('returns empty mistake-review statistics without patterns or attempts', () => {
    expect(calculateMistakeReviewStatistics([], [])).toEqual({
      activePatterns: 0,
      masteredPatterns: 0,
      similarQuestionsPracticed: 0,
      reviewQuestionsCorrect: 0,
      mostMissedOperations: [],
      patternsByFrequency: [],
      recentReviewAttempts: [],
    });
  });

  it('calculates review totals, sorts facts, and preserves operation ties', () => {
    const patterns: MistakePattern[] = [
      {
        id: 'addition-newer',
        operation: 'addition',
        firstOperand: 7,
        secondOperand: 8,
        correctAnswer: 15,
        difficulty: 2,
        incorrectCount: 3,
        similarCorrectCount: 1,
        similarAttemptCount: 2,
        lastIncorrectAt: '2026-10-21T20:00:00Z',
        mastered: false,
      },
      {
        id: 'multiplication-older',
        operation: 'multiplication',
        firstOperand: 6,
        secondOperand: 7,
        correctAnswer: 42,
        difficulty: 2,
        incorrectCount: 3,
        similarCorrectCount: 3,
        similarAttemptCount: 3,
        lastIncorrectAt: '2026-10-20T20:00:00Z',
        mastered: true,
      },
      {
        id: 'division',
        operation: 'division',
        firstOperand: 20,
        secondOperand: 5,
        correctAnswer: 4,
        difficulty: 1,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: '2026-10-19T20:00:00Z',
        mastered: false,
      },
    ];
    const reviewAttempts: PracticeAttempt[] = [
      {
        ...attempts[0],
        id: 'review-correct',
        source: 'mistake-review',
        mistakePatternId: 'addition-newer',
        attemptedAt: '2026-10-21T21:00:00Z',
      },
      {
        ...attempts[1],
        id: 'review-wrong',
        source: 'mistake-review',
        mistakePatternId: 'multiplication-older',
        attemptedAt: '2026-10-21T22:00:00Z',
      },
    ];

    const result = calculateMistakeReviewStatistics(patterns, [
      ...attempts,
      ...reviewAttempts,
    ]);
    expect(result).toMatchObject({
      activePatterns: 2,
      masteredPatterns: 1,
      similarQuestionsPracticed: 2,
      reviewQuestionsCorrect: 1,
      mostMissedOperations: ['addition', 'multiplication'],
    });
    expect(result.patternsByFrequency.map(({ id }) => id)).toEqual([
      'addition-newer',
      'multiplication-older',
      'division',
    ]);
    expect(result.recentReviewAttempts.map(({ id }) => id)).toEqual([
      'review-wrong',
      'review-correct',
    ]);
  });
});
