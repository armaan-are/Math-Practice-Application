import type { DifficultyLevel, MathOperation, MistakePattern, Question } from '../types';
import { createId } from '../utils/ids';
import { randomInteger } from '../utils/random';
import { generateAnswerChoices, validateAnswerChoices } from './answerChoices';

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family';

type RelatedQuestion = Pick<
  Question,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer' | 'difficulty'
>;

export interface SimilarQuestionCandidate extends RelatedQuestion {
  strategy: SimilarityStrategy;
}

export interface SimilarQuestionOptions {
  excludeQuestionKeys?: readonly string[];
}

const symbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

const maximumOperand: Record<DifficultyLevel, number> = {
  1: 10,
  2: 50,
  3: 100,
  4: 1000,
};

export function similarQuestionKey(
  question: Pick<Question, 'operation' | 'firstOperand' | 'secondOperand'>,
): string {
  return `${question.operation}:${question.firstOperand}:${question.secondOperand}`;
}

export function matchesDifficulty(question: RelatedQuestion): boolean {
  const {
    operation,
    firstOperand: first,
    secondOperand: second,
    correctAnswer,
  } = question;

  if (
    !Number.isInteger(first) ||
    !Number.isInteger(second) ||
    !Number.isInteger(correctAnswer) ||
    first < 0 ||
    second < 0 ||
    correctAnswer < 0
  ) {
    return false;
  }

  switch (operation) {
    case 'addition': {
      const maximum = maximumOperand[question.difficulty];
      const resultMaximum = maximum * 2;
      return (
        first <= maximum &&
        second <= maximum &&
        first + second === correctAnswer &&
        correctAnswer <= resultMaximum
      );
    }
    case 'subtraction': {
      const maximum = maximumOperand[question.difficulty];
      return (
        first <= maximum &&
        second <= maximum &&
        first >= second &&
        first - second === correctAnswer
      );
    }
    case 'multiplication':
      if (first * second !== correctAnswer) return false;
      if (question.difficulty === 1) return first <= 5 && second <= 5;
      if (question.difficulty === 2) return first <= 10 && second <= 10;
      if (question.difficulty === 3) {
        return first <= 99 && second <= 99 && (first <= 9 || second <= 9);
      }
      return first <= 99 && second <= 99 && (first >= 10 || second >= 10);
    case 'division':
      if (second === 0 || first / second !== correctAnswer) return false;
      if (question.difficulty === 1) return second <= 5 && correctAnswer <= 5;
      if (question.difficulty === 2) return second <= 10 && correctAnswer <= 10;
      if (question.difficulty === 3) return second <= 12 && first <= 144;
      return second <= 99 && correctAnswer >= 1 && correctAnswer <= 99;
  }
}

function calculate(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): number | null {
  switch (operation) {
    case 'addition':
      return firstOperand + secondOperand;
    case 'subtraction':
      return firstOperand - secondOperand;
    case 'multiplication':
      return firstOperand * secondOperand;
    case 'division':
      return secondOperand === 0 ? null : firstOperand / secondOperand;
  }
}

function candidate(
  pattern: MistakePattern,
  strategy: SimilarityStrategy,
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): SimilarQuestionCandidate | null {
  const correctAnswer = calculate(operation, firstOperand, secondOperand);
  if (correctAnswer === null) return null;

  const result: SimilarQuestionCandidate = {
    strategy,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    difficulty: pattern.difficulty,
  };

  return matchesDifficulty(result) ? result : null;
}

function uniqueCandidates(
  candidates: Array<SimilarQuestionCandidate | null>,
): SimilarQuestionCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((item): item is SimilarQuestionCandidate => {
    if (!item) return false;
    const key = similarQuestionKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateNearbyCandidates(
  pattern: MistakePattern,
): SimilarQuestionCandidate[] {
  const results: Array<SimilarQuestionCandidate | null> = [];
  const nearbyChanges = [-2, -1, 1, 2];

  if (pattern.operation === 'division') {
    const divisor = pattern.secondOperand;
    const quotient = pattern.correctAnswer;

    for (const change of nearbyChanges) {
      const nearbyDivisor = divisor + change;
      const nearbyQuotient = quotient + change;
      results.push(
        candidate(pattern, 'nearby', 'division', nearbyDivisor * quotient, nearbyDivisor),
        candidate(pattern, 'nearby', 'division', divisor * nearbyQuotient, divisor),
      );
    }
  } else {
    for (const change of nearbyChanges) {
      results.push(
        candidate(
          pattern,
          'nearby',
          pattern.operation,
          pattern.firstOperand + change,
          pattern.secondOperand,
        ),
        candidate(
          pattern,
          'nearby',
          pattern.operation,
          pattern.firstOperand,
          pattern.secondOperand + change,
        ),
      );
    }
  }

  const originalKey = similarQuestionKey(pattern);
  return uniqueCandidates(results).filter(
    (item) => similarQuestionKey(item) !== originalKey,
  );
}

export function generateReversedOperandCandidates(
  pattern: MistakePattern,
): SimilarQuestionCandidate[] {
  if (
    (pattern.operation !== 'addition' && pattern.operation !== 'multiplication') ||
    pattern.firstOperand === pattern.secondOperand
  ) {
    return [];
  }

  return uniqueCandidates([
    candidate(
      pattern,
      'reversed',
      pattern.operation,
      pattern.secondOperand,
      pattern.firstOperand,
    ),
  ]);
}

export function generateFactFamilyCandidates(
  pattern: MistakePattern,
): SimilarQuestionCandidate[] {
  switch (pattern.operation) {
    case 'addition':
      return uniqueCandidates([
        candidate(
          pattern,
          'fact-family',
          'subtraction',
          pattern.correctAnswer,
          pattern.firstOperand,
        ),
        candidate(
          pattern,
          'fact-family',
          'subtraction',
          pattern.correctAnswer,
          pattern.secondOperand,
        ),
      ]);
    case 'subtraction':
      return uniqueCandidates([
        candidate(
          pattern,
          'fact-family',
          'addition',
          pattern.secondOperand,
          pattern.correctAnswer,
        ),
        candidate(
          pattern,
          'fact-family',
          'addition',
          pattern.correctAnswer,
          pattern.secondOperand,
        ),
      ]);
    case 'multiplication':
      return uniqueCandidates([
        candidate(
          pattern,
          'fact-family',
          'division',
          pattern.correctAnswer,
          pattern.firstOperand,
        ),
        candidate(
          pattern,
          'fact-family',
          'division',
          pattern.correctAnswer,
          pattern.secondOperand,
        ),
      ]);
    case 'division':
      return uniqueCandidates([
        candidate(
          pattern,
          'fact-family',
          'multiplication',
          pattern.secondOperand,
          pattern.correctAnswer,
        ),
        candidate(
          pattern,
          'fact-family',
          'multiplication',
          pattern.correctAnswer,
          pattern.secondOperand,
        ),
      ]);
  }
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  options: SimilarQuestionOptions = {},
): Question {
  const strategies = [
    generateNearbyCandidates(pattern),
    generateReversedOperandCandidates(pattern),
    generateFactFamilyCandidates(pattern),
  ].filter((items) => items.length > 0);

  const excluded = new Set(options.excludeQuestionKeys ?? []);
  const preferredStrategies = strategies
    .map((items) => items.filter((item) => !excluded.has(similarQuestionKey(item))))
    .filter((items) => items.length > 0);
  const availableStrategies =
    preferredStrategies.length > 0 ? preferredStrategies : strategies;

  if (availableStrategies.length === 0) {
    throw new Error('No valid similar question could be generated.');
  }

  const selectedStrategy =
    availableStrategies[randomInteger(0, availableStrategies.length - 1)];
  const selected = selectedStrategy[randomInteger(0, selectedStrategy.length - 1)];
  const questionWithoutChoices: Omit<Question, 'choices'> = {
    id: createId('question'),
    operation: selected.operation,
    firstOperand: selected.firstOperand,
    secondOperand: selected.secondOperand,
    displayText: `${selected.firstOperand} ${symbols[selected.operation]} ${selected.secondOperand} = ?`,
    correctAnswer: selected.correctAnswer,
    difficulty: selected.difficulty,
    source: 'mistake-review',
    mistakePatternId: pattern.id,
  };
  const question: Question = {
    ...questionWithoutChoices,
    choices: generateAnswerChoices(questionWithoutChoices),
  };

  if (!matchesDifficulty(question) || !validateAnswerChoices(question)) {
    throw new Error('The generated similar question was invalid.');
  }

  return question;
}
