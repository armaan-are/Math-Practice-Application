import type { DifficultyLevel, MathOperation } from './question';

export interface MistakePattern {
  id: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  incorrectCount: number;
  similarCorrectCount: number;
  similarAttemptCount: number;
  lastIncorrectAt: string;
  mastered: boolean;
}
