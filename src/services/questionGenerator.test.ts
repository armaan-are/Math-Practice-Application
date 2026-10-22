import { describe, expect, it, vi } from 'vitest';
import type { DifficultyLevel, MathOperation } from '../types';
import {
  generateAddition,
  generateDivision,
  generateMultiplication,
  generateQuestion,
  generateSubtraction,
  validateQuestionArithmetic,
  validateQuestion,
} from './questionGenerator';

const levels: DifficultyLevel[] = [1, 2, 3, 4];
const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

describe('question generation', () => {
  it.each(levels)('generates valid addition at level %i', (level) => {
    for (let count = 0; count < 250; count += 1) {
      const question = generateAddition(level);
      const maximum = { 1: 10, 2: 50, 3: 100, 4: 1000 }[level];
      expect(question.firstOperand).toBeGreaterThanOrEqual(0);
      expect(question.firstOperand).toBeLessThanOrEqual(maximum);
      expect(question.secondOperand).toBeLessThanOrEqual(maximum);
      if (level === 1) expect(question.correctAnswer).toBeLessThanOrEqual(20);
      if (level === 2) expect(question.correctAnswer).toBeLessThanOrEqual(100);
      expect(validateQuestionArithmetic(question)).toBe(true);
    }
  });

  it.each(levels)('generates nonnegative subtraction at level %i', (level) => {
    for (let count = 0; count < 250; count += 1) {
      const question = generateSubtraction(level);
      expect(question.firstOperand).toBeGreaterThanOrEqual(question.secondOperand);
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(validateQuestionArithmetic(question)).toBe(true);
    }
  });

  it.each(levels)('uses the specified multiplication ranges at level %i', (level) => {
    for (let count = 0; count < 250; count += 1) {
      const question = generateMultiplication(level);
      if (level === 1) {
        expect(question.firstOperand).toBeLessThanOrEqual(5);
        expect(question.secondOperand).toBeLessThanOrEqual(5);
      } else if (level === 2) {
        expect(question.firstOperand).toBeLessThanOrEqual(10);
        expect(question.secondOperand).toBeLessThanOrEqual(10);
      } else if (level === 3) {
        expect(question.firstOperand).toBeLessThanOrEqual(9);
        expect(question.secondOperand).toBeLessThanOrEqual(99);
      } else {
        expect(question.firstOperand).toBeGreaterThanOrEqual(10);
        expect(question.firstOperand).toBeLessThanOrEqual(99);
        expect(question.secondOperand).toBeLessThanOrEqual(99);
      }
      expect(validateQuestionArithmetic(question)).toBe(true);
    }
  });

  it.each(levels)(
    'never divides by zero or creates fractional answers at level %i',
    (level) => {
      for (let count = 0; count < 500; count += 1) {
        const question = generateDivision(level);
        expect(question.secondOperand).toBeGreaterThan(0);
        expect(Number.isInteger(question.correctAnswer)).toBe(true);
        expect(question.firstOperand % question.secondOperand).toBe(0);
        if (level === 3) expect(question.firstOperand).toBeLessThanOrEqual(144);
        expect(validateQuestionArithmetic(question)).toBe(true);
      }
    },
  );

  it('selects among enabled operations and rejects an empty selection', () => {
    const seen = new Set<MathOperation>();
    for (let count = 0; count < 300; count += 1) {
      seen.add(generateQuestion(operations, 2).operation);
    }
    expect(seen).toEqual(new Set(operations));
    expect(() => generateQuestion([], 1)).toThrow(/at least one operation/i);
  });

  it('retries invalid generation up to a maximum and returns a valid fallback', () => {
    const generateBase = vi.fn().mockReturnValue({
      id: 'invalid',
      operation: 'division',
      firstOperand: 5,
      secondOperand: 0,
      displayText: '5 ÷ 0 = ?',
      correctAnswer: Number.POSITIVE_INFINITY,
      difficulty: 2,
      source: 'regular',
    });
    const logger = { error: vi.fn() };

    const question = generateQuestion('division', 2, {
      generateBase,
      logger,
      maxAttempts: 3,
    });

    expect(generateBase).toHaveBeenCalledTimes(3);
    expect(validateQuestion(question)).toBe(true);
    expect(question).toMatchObject({
      operation: 'division',
      difficulty: 2,
      firstOperand: 56,
      secondOperand: 7,
      correctAnswer: 8,
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('safe division fallback after 3 invalid attempts'),
    );
  });

  it('recovers when a generator throws instead of exposing the error', () => {
    const logger = { error: vi.fn() };
    expect(() =>
      generateQuestion('addition', 1, {
        generateBase: () => {
          throw new Error('simulated generator failure');
        },
        logger,
        maxAttempts: 2,
      }),
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
