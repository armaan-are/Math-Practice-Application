import type { Question } from '../types';
import { randomInteger } from '../utils/random';
import { shuffle } from '../utils/shuffle';

function operationDistractors(question: Omit<Question, 'choices'>): number[] {
  const {
    firstOperand: first,
    secondOperand: second,
    correctAnswer,
    operation,
  } = question;

  switch (operation) {
    case 'addition':
      return [first + Math.max(0, second - 1), first + second + 1, first + second - 2];
    case 'subtraction':
      return [first - Math.max(0, second - 1), first - second + 1, second - first];
    case 'multiplication':
      return [
        first * Math.max(0, second - 1),
        (first + 1) * second,
        correctAnswer + first + second,
      ];
    case 'division':
      return [correctAnswer - 1, correctAnswer + 1, correctAnswer + second];
  }
}

export function generateAnswerChoices(question: Omit<Question, 'choices'>): number[] {
  const distractors = new Set<number>();
  const addCandidate = (candidate: number) => {
    if (
      Number.isInteger(candidate) &&
      candidate >= 0 &&
      candidate !== question.correctAnswer
    ) {
      distractors.add(candidate);
    }
  };

  operationDistractors(question).forEach(addCandidate);

  for (let attempt = 0; distractors.size < 3 && attempt < 40; attempt += 1) {
    const distance = randomInteger(
      1,
      Math.max(4, Math.ceil(Math.abs(question.correctAnswer) * 0.2)),
    );
    addCandidate(question.correctAnswer + (Math.random() < 0.5 ? -distance : distance));
  }

  for (let distance = 1; distractors.size < 3; distance += 1) {
    addCandidate(question.correctAnswer + distance);
    addCandidate(question.correctAnswer - distance);
  }

  return shuffle([question.correctAnswer, ...Array.from(distractors).slice(0, 3)]);
}

export function validateAnswerChoices(question: Question): boolean {
  return (
    question.choices.length === 4 &&
    new Set(question.choices).size === 4 &&
    question.choices.every((choice) => Number.isInteger(choice) && choice >= 0) &&
    question.choices.filter((choice) => choice === question.correctAnswer).length === 1
  );
}
