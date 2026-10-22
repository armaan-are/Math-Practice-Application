import type { MistakePattern, PracticeAttempt } from '../types';
import { createId } from '../utils/ids';
import {
  loadMistakePatterns,
  saveMistakePatterns,
  type StorageResult,
} from './storageService';

/**
 * Addition and multiplication are commutative, so their reversed operands
 * represent the same fact. Subtraction and division preserve their original
 * operand order because reversing either operation changes its meaning.
 */
export function mistakePatternKey(
  pattern: Pick<
    MistakePattern,
    'operation' | 'firstOperand' | 'secondOperand' | 'difficulty'
  >,
): string {
  const { operation, difficulty } = pattern;
  let { firstOperand, secondOperand } = pattern;

  if (
    (operation === 'addition' || operation === 'multiplication') &&
    firstOperand > secondOperand
  ) {
    [firstOperand, secondOperand] = [secondOperand, firstOperand];
  }

  return `${operation}:${firstOperand}:${secondOperand}:level-${difficulty}`;
}

export function updateMistakePatterns(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
): MistakePattern[] {
  if (attempt.selfReportedCorrect) return [...patterns];

  const key = mistakePatternKey(attempt);
  const existingIndex = patterns.findIndex(
    (pattern) => mistakePatternKey(pattern) === key,
  );

  if (existingIndex === -1) {
    return [
      ...patterns,
      {
        id: createId('mistake'),
        operation: attempt.operation,
        firstOperand: attempt.firstOperand,
        secondOperand: attempt.secondOperand,
        correctAnswer: attempt.correctAnswer,
        difficulty: attempt.difficulty,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: attempt.attemptedAt,
        mastered: false,
      },
    ];
  }

  return patterns.map((pattern, index) =>
    index === existingIndex
      ? {
          ...pattern,
          incorrectCount: pattern.incorrectCount + 1,
          similarCorrectCount: 0,
          lastIncorrectAt: attempt.attemptedAt,
          mastered: false,
        }
      : pattern,
  );
}

export function recordMistakeForAttempt(attempt: PracticeAttempt): StorageResult {
  if (attempt.selfReportedCorrect) return { ok: true };
  return saveMistakePatterns(updateMistakePatterns(loadMistakePatterns(), attempt));
}
