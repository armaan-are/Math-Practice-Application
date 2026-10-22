import type { DifficultyLevel, MathOperation, Question } from '../types';
import { createId } from '../utils/ids';
import { randomInteger } from '../utils/random';
import { shuffle } from '../utils/shuffle';
import { generateAnswerChoices, validateAnswerChoices } from './answerChoices';

type QuestionWithoutChoices = Omit<Question, 'choices'>;
const MAX_GENERATION_ATTEMPTS = 20;

interface QuestionGenerationOptions {
  generateBase?: (
    operation: MathOperation,
    difficulty: DifficultyLevel,
  ) => QuestionWithoutChoices;
  generateChoices?: (question: QuestionWithoutChoices) => number[];
  logger?: Pick<Console, 'error'>;
  maxAttempts?: number;
}

const symbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

function makeQuestion(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
  difficulty: DifficultyLevel,
): QuestionWithoutChoices {
  return {
    id: createId('question'),
    operation,
    firstOperand,
    secondOperand,
    displayText: `${firstOperand} ${symbols[operation]} ${secondOperand} = ?`,
    correctAnswer,
    difficulty,
    source: 'regular',
  };
}

export function generateAddition(difficulty: DifficultyLevel): QuestionWithoutChoices {
  const maximum = { 1: 10, 2: 50, 3: 100, 4: 1000 }[difficulty];
  const first = randomInteger(0, maximum);
  const secondMaximum =
    difficulty <= 2 ? Math.min(maximum, maximum * 2 - first) : maximum;
  const second = randomInteger(0, secondMaximum);
  return makeQuestion('addition', first, second, first + second, difficulty);
}

export function generateSubtraction(difficulty: DifficultyLevel): QuestionWithoutChoices {
  const maximum = { 1: 10, 2: 50, 3: 100, 4: 1000 }[difficulty];
  const firstGenerated = randomInteger(0, maximum);
  const secondGenerated = randomInteger(0, maximum);
  const first = Math.max(firstGenerated, secondGenerated);
  const second = Math.min(firstGenerated, secondGenerated);
  return makeQuestion('subtraction', first, second, first - second, difficulty);
}

export function generateMultiplication(
  difficulty: DifficultyLevel,
): QuestionWithoutChoices {
  let first: number;
  let second: number;

  if (difficulty === 1) {
    first = randomInteger(0, 5);
    second = randomInteger(0, 5);
  } else if (difficulty === 2) {
    first = randomInteger(0, 10);
    second = randomInteger(0, 10);
  } else if (difficulty === 3) {
    first = randomInteger(0, 9);
    second = randomInteger(0, 99);
  } else {
    first = randomInteger(10, 99);
    second = Math.random() < 0.5 ? randomInteger(2, 9) : randomInteger(10, 99);
  }

  return makeQuestion('multiplication', first, second, first * second, difficulty);
}

export function generateDivision(difficulty: DifficultyLevel): QuestionWithoutChoices {
  let divisor: number;
  let quotient: number;

  if (difficulty === 1) {
    divisor = randomInteger(1, 5);
    quotient = randomInteger(0, 5);
  } else if (difficulty === 2) {
    divisor = randomInteger(1, 10);
    quotient = randomInteger(0, 10);
  } else if (difficulty === 3) {
    divisor = randomInteger(1, 12);
    quotient = randomInteger(0, Math.min(12, Math.floor(144 / divisor)));
  } else {
    divisor = randomInteger(1, 99);
    quotient = randomInteger(1, 99);
  }

  const dividend = divisor * quotient;
  return makeQuestion('division', dividend, divisor, quotient, difficulty);
}

export function validateQuestionArithmetic(question: QuestionWithoutChoices): boolean {
  if (!Number.isFinite(question.correctAnswer)) return false;

  switch (question.operation) {
    case 'addition':
      return question.firstOperand + question.secondOperand === question.correctAnswer;
    case 'subtraction':
      return (
        question.firstOperand >= question.secondOperand &&
        question.firstOperand - question.secondOperand === question.correctAnswer
      );
    case 'multiplication':
      return question.firstOperand * question.secondOperand === question.correctAnswer;
    case 'division':
      return (
        question.secondOperand !== 0 &&
        Number.isInteger(question.correctAnswer) &&
        question.firstOperand / question.secondOperand === question.correctAnswer
      );
  }
}

const generators: Record<
  MathOperation,
  (difficulty: DifficultyLevel) => QuestionWithoutChoices
> = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
};

const fallbackFacts: Record<
  MathOperation,
  Record<DifficultyLevel, [number, number, number]>
> = {
  addition: { 1: [2, 3, 5], 2: [24, 15, 39], 3: [47, 38, 85], 4: [320, 145, 465] },
  subtraction: { 1: [8, 3, 5], 2: [42, 17, 25], 3: [93, 48, 45], 4: [720, 265, 455] },
  multiplication: { 1: [3, 4, 12], 2: [7, 8, 56], 3: [8, 24, 192], 4: [12, 14, 168] },
  division: { 1: [12, 3, 4], 2: [56, 7, 8], 3: [108, 9, 12], 4: [144, 12, 12] },
};

function fallbackQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
): Question {
  const [first, second, answer] = fallbackFacts[operation][difficulty];
  const base = makeQuestion(operation, first, second, answer, difficulty);
  const distractors = [answer - 1, answer + 1, answer + 2].filter(
    (choice) => choice >= 0 && choice !== answer,
  );
  for (let distance = 3; distractors.length < 3; distance += 1) {
    distractors.push(answer + distance);
  }
  const choices = [answer, ...distractors.slice(0, 3)];
  return {
    ...base,
    choices: shuffle(choices),
  };
}

export function validateQuestion(question: Question): boolean {
  return validateQuestionArithmetic(question) && validateAnswerChoices(question);
}

export function generateQuestion(
  operations: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
  options: QuestionGenerationOptions = {},
): Question {
  const operationList: readonly MathOperation[] =
    typeof operations === 'string' ? [operations] : operations;
  if (operationList.length === 0) {
    throw new Error('At least one operation is required to generate a question.');
  }

  const maxAttempts = Math.max(1, options.maxAttempts ?? MAX_GENERATION_ATTEMPTS);
  const generateBase =
    options.generateBase ??
    ((operation: MathOperation, level: DifficultyLevel) => generators[operation](level));
  const generateChoices = options.generateChoices ?? generateAnswerChoices;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const operation = operationList[randomInteger(0, operationList.length - 1)];
    try {
      const generated = generateBase(operation, difficulty);
      if (validateQuestionArithmetic(generated)) {
        const question = { ...generated, choices: generateChoices(generated) };
        if (validateQuestion(question)) return question;
      }
    } catch {
      // Retry with a fresh candidate before using the safe fallback below.
    }
  }

  const fallback = fallbackQuestion(operationList[0], difficulty);
  options.logger?.error(
    `[questionGenerator] Used a safe ${operationList[0]} fallback after ${maxAttempts} invalid attempts.`,
  );
  if (!options.logger) {
    console.error(
      `[questionGenerator] Used a safe ${operationList[0]} fallback after ${maxAttempts} invalid attempts.`,
    );
  }
  return fallback;
}
