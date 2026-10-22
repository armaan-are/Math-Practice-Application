import { describe, expect, it } from 'vitest';
import type { MistakePattern, PracticeAttempt } from '../types';
import {
  activeMistakePatterns,
  mistakeReviewPriority,
  prioritizeMistakePatterns,
  selectMistakePattern,
  updatePatternsForReviewAttempt,
  updateReviewProgress,
} from './mistakeReviewService';

function pattern(overrides: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id: 'pattern-1',
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    difficulty: 2,
    incorrectCount: 1,
    similarCorrectCount: 0,
    similarAttemptCount: 0,
    lastIncorrectAt: '2026-10-20T12:00:00.000Z',
    mastered: false,
    ...overrides,
  };
}

function reviewAttempt(overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id: 'attempt-1',
    questionId: 'question-1',
    operation: 'multiplication',
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    selectedAnswer: 56,
    selfReportedCorrect: true,
    difficulty: 2,
    source: 'mistake-review',
    mistakePatternId: 'pattern-1',
    attemptedAt: '2026-10-21T12:00:00.000Z',
    sessionId: 'session-1',
    ...overrides,
  };
}

describe('mistake review service', () => {
  it('filters review to active patterns matching the chosen operation and level', () => {
    const patterns = [
      pattern(),
      pattern({ id: 'mastered', mastered: true }),
      pattern({ id: 'addition', operation: 'addition', correctAnswer: 15 }),
      pattern({ id: 'level-3', difficulty: 3 }),
    ];

    expect(activeMistakePatterns(patterns, ['multiplication'], 2)).toEqual([patterns[0]]);
  });

  it('prioritizes frequency, recency, and less successful review', () => {
    const now = Date.parse('2026-10-21T12:00:00.000Z');
    const base = pattern();
    expect(mistakeReviewPriority(pattern({ incorrectCount: 2 }), 3, now)).toBeGreaterThan(
      mistakeReviewPriority(base, 3, now),
    );
    expect(
      mistakeReviewPriority(
        pattern({ lastIncorrectAt: '2026-10-21T11:00:00.000Z' }),
        3,
        now,
      ),
    ).toBeGreaterThan(
      mistakeReviewPriority(
        pattern({ lastIncorrectAt: '2026-09-01T12:00:00.000Z' }),
        3,
        now,
      ),
    );
    expect(mistakeReviewPriority(base, 3, now)).toBeGreaterThan(
      mistakeReviewPriority(pattern({ similarCorrectCount: 2 }), 3, now),
    );
  });

  it('randomizes equal-priority patterns and avoids the immediately previous one', () => {
    const patterns = [pattern({ id: 'a' }), pattern({ id: 'b' })];
    const randomValues = [0.9, 0.1];
    expect(
      prioritizeMistakePatterns(
        patterns,
        3,
        Date.parse('2026-10-21T12:00:00.000Z'),
        () => randomValues.shift() ?? 0,
      ).map(({ id }) => id),
    ).toEqual(['b', 'a']);
    expect(selectMistakePattern(patterns, 3, 'a')?.id).toBe('b');
  });

  it('increments review progress and masters at the configured threshold', () => {
    const patterns = [pattern({ similarCorrectCount: 1, similarAttemptCount: 2 })];
    const updated = updateReviewProgress(patterns, 'pattern-1', true, 2);
    expect(updated[0]).toMatchObject({
      similarCorrectCount: 2,
      similarAttemptCount: 3,
      mastered: true,
    });
  });

  it('counts a wrong review and keeps the originating pattern active', () => {
    const updated = updatePatternsForReviewAttempt(
      [pattern()],
      reviewAttempt({
        operation: 'division',
        firstOperand: 56,
        secondOperand: 7,
        correctAnswer: 8,
        selectedAnswer: 7,
        selfReportedCorrect: false,
      }),
      3,
    );

    expect(updated.find(({ id }) => id === 'pattern-1')).toMatchObject({
      similarCorrectCount: 0,
      similarAttemptCount: 1,
      mastered: false,
    });
    expect(updated).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'division',
          firstOperand: 56,
          secondOperand: 7,
          incorrectCount: 1,
        }),
      ]),
    );
  });

  it('reactivates a mastered fact after that fact is missed again', () => {
    const mastered = pattern({ similarCorrectCount: 3, mastered: true });
    const updated = updatePatternsForReviewAttempt(
      [mastered],
      reviewAttempt({ selfReportedCorrect: false }),
      3,
    );
    expect(updated[0]).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      similarAttemptCount: 1,
      mastered: false,
    });
  });
});
