import { describe, expect, it, vi } from 'vitest';
import type { DifficultyLevel, MathOperation, MistakePattern } from '../types';
import { validateAnswerChoices } from './answerChoices';
import {
  generateFactFamilyCandidates,
  generateNearbyCandidates,
  generateReversedOperandCandidates,
  generateSimilarQuestion,
  matchesDifficulty,
  similarQuestionKey,
} from './similarQuestionGenerator';

function pattern(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
  difficulty: DifficultyLevel = 2,
): MistakePattern {
  return {
    id: `mistake-${operation}`,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    similarAttemptCount: 0,
    lastIncorrectAt: '2026-10-21T20:00:00.000Z',
    mastered: false,
  };
}

describe('similar question generation', () => {
  it.each([
    pattern('addition', 8, 7, 15),
    pattern('subtraction', 9, 4, 5),
    pattern('multiplication', 8, 7, 56),
    pattern('division', 56, 7, 8),
  ])(
    'creates valid nearby $operation questions without repeating the original',
    (item) => {
      const candidates = generateNearbyCandidates(item);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every(matchesDifficulty)).toBe(true);
      expect(
        candidates.every((candidate) => candidate.operation === item.operation),
      ).toBe(true);
      expect(candidates.map(similarQuestionKey)).not.toContain(similarQuestionKey(item));
    },
  );

  it('keeps nearby subtraction nonnegative and nearby division whole-numbered', () => {
    const subtraction = generateNearbyCandidates(pattern('subtraction', 1, 0, 1, 1));
    expect(
      subtraction.every(
        (item) => item.firstOperand >= item.secondOperand && item.correctAnswer >= 0,
      ),
    ).toBe(true);

    const division = generateNearbyCandidates(pattern('division', 1, 1, 1, 1));
    expect(
      division.every(
        (item) =>
          item.secondOperand > 0 &&
          Number.isInteger(item.correctAnswer) &&
          item.firstOperand % item.secondOperand === 0,
      ),
    ).toBe(true);
  });

  it('reverses only commutative operations', () => {
    expect(generateReversedOperandCandidates(pattern('addition', 3, 8, 11))).toEqual([
      expect.objectContaining({
        operation: 'addition',
        firstOperand: 8,
        secondOperand: 3,
        correctAnswer: 11,
      }),
    ]);
    expect(
      generateReversedOperandCandidates(pattern('multiplication', 6, 9, 54)),
    ).toEqual([
      expect.objectContaining({
        operation: 'multiplication',
        firstOperand: 9,
        secondOperand: 6,
        correctAnswer: 54,
      }),
    ]);
    expect(generateReversedOperandCandidates(pattern('subtraction', 9, 4, 5))).toEqual(
      [],
    );
    expect(generateReversedOperandCandidates(pattern('division', 12, 3, 4))).toEqual([]);
  });

  it('creates inverse addition and subtraction fact families', () => {
    const fromAddition = generateFactFamilyCandidates(pattern('addition', 4, 3, 7, 1));
    expect(fromAddition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'subtraction',
          firstOperand: 7,
          secondOperand: 4,
          correctAnswer: 3,
        }),
      ]),
    );

    const fromSubtraction = generateFactFamilyCandidates(
      pattern('subtraction', 9, 4, 5, 1),
    );
    expect(fromSubtraction).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'addition',
          firstOperand: 4,
          secondOperand: 5,
          correctAnswer: 9,
        }),
      ]),
    );
  });

  it('creates inverse multiplication and division fact families', () => {
    const fromMultiplication = generateFactFamilyCandidates(
      pattern('multiplication', 7, 8, 56),
    );
    expect(fromMultiplication).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'division',
          firstOperand: 56,
          secondOperand: 7,
          correctAnswer: 8,
        }),
      ]),
    );

    const fromDivision = generateFactFamilyCandidates(pattern('division', 56, 7, 8));
    expect(fromDivision).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'multiplication',
          firstOperand: 7,
          secondOperand: 8,
          correctAnswer: 56,
        }),
      ]),
    );
  });

  it('selects among the available similarity strategies', () => {
    const item = pattern('addition', 3, 8, 11);
    const random = vi.spyOn(Math, 'random');

    random.mockReturnValueOnce(0.4).mockReturnValue(0.5);
    expect(generateSimilarQuestion(item)).toMatchObject({
      operation: 'addition',
      firstOperand: 8,
      secondOperand: 3,
    });

    random.mockReset();
    random.mockReturnValueOnce(0.9).mockReturnValueOnce(0).mockReturnValue(0.5);
    expect(generateSimilarQuestion(item)).toMatchObject({
      operation: 'subtraction',
      firstOperand: 11,
      secondOperand: 3,
      correctAnswer: 8,
    });

    random.mockRestore();
  });

  it('omits inverse facts that would leave the selected difficulty range', () => {
    const candidates = generateFactFamilyCandidates(pattern('addition', 8, 7, 15, 1));
    expect(candidates).toEqual([]);
  });

  it.each([
    pattern('addition', 10, 10, 20, 1),
    pattern('subtraction', 50, 0, 50, 2),
    pattern('multiplication', 9, 99, 891, 3),
    pattern('division', 9801, 99, 99, 4),
  ])('returns a complete review question for boundary $operation facts', (item) => {
    for (let count = 0; count < 50; count += 1) {
      const question = generateSimilarQuestion(item);
      expect(question.source).toBe('mistake-review');
      expect(question.mistakePatternId).toBe(item.id);
      expect(question.difficulty).toBe(item.difficulty);
      expect(matchesDifficulty(question)).toBe(true);
      expect(validateAnswerChoices(question)).toBe(true);
      expect(similarQuestionKey(question)).not.toBe(similarQuestionKey(item));
    }
  });

  it('avoids recently used questions when another valid choice exists', () => {
    const item = pattern('addition', 8, 7, 15);
    const candidates = [
      ...generateNearbyCandidates(item),
      ...generateReversedOperandCandidates(item),
      ...generateFactFamilyCandidates(item),
    ];
    const allowed = candidates.at(-1)!;
    const excludeQuestionKeys = candidates
      .slice(0, -1)
      .map((candidate) => similarQuestionKey(candidate));

    for (let count = 0; count < 20; count += 1) {
      expect(
        similarQuestionKey(generateSimilarQuestion(item, { excludeQuestionKeys })),
      ).toBe(similarQuestionKey(allowed));
    }
  });
});
