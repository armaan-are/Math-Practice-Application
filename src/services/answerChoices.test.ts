import { describe, expect, it } from 'vitest';
import type { DifficultyLevel, MathOperation } from '../types';
import { validateAnswerChoices } from './answerChoices';
import { generateQuestion } from './questionGenerator';

const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];
const levels: DifficultyLevel[] = [1, 2, 3, 4];

describe('multiple-choice answer generation', () => {
  it.each(operations)('creates four valid choices for %s', (operation) => {
    for (const level of levels) {
      for (let count = 0; count < 300; count += 1) {
        const question = generateQuestion(operation, level);
        expect(validateAnswerChoices(question)).toBe(true);
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.choices).toContain(question.correctAnswer);
        expect(question.choices.every(Number.isInteger)).toBe(true);
        expect(question.choices.every((choice) => choice >= 0)).toBe(true);
      }
    }
  });

  it('does not leave the correct answer in a predictable position', () => {
    const positions = new Set<number>();
    for (let count = 0; count < 500; count += 1) {
      const question = generateQuestion('multiplication', 2);
      positions.add(question.choices.indexOf(question.correctAnswer));
    }
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });

  it('handles answers at and near zero', () => {
    for (let count = 0; count < 500; count += 1) {
      const question = generateQuestion('subtraction', 1);
      expect(validateAnswerChoices(question)).toBe(true);
    }
  });
});
