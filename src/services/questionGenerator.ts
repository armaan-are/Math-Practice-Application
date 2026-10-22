import type { DifficultyLevel, MathOperation, Question } from '../types';
import { createId } from '../utils/ids';
import { randomInteger } from '../utils/random';

type QuestionWithoutChoices = Omit<Question, 'choices'>;

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

export function generateQuestion(
  operations: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
): Question {
  const operationList: readonly MathOperation[] =
    typeof operations === 'string' ? [operations] : operations;
  if (operationList.length === 0) {
    throw new Error('At least one operation is required to generate a question.');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const operation = operationList[randomInteger(0, operationList.length - 1)];
    const generated = generators[operation](difficulty);
    if (validateQuestionArithmetic(generated)) return { ...generated, choices: [] };
  }

  throw new Error('A valid math question could not be generated.');
}
