import type {
  DifficultyLevel,
  MathOperation,
  Question,
  QuestionSource,
} from './question';

export type SessionLength = 5 | 10 | 20 | 'continuous';
export type ReviewMode = 'regular' | 'mistake-review';

export interface PracticeConfiguration {
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  reviewMode: ReviewMode;
}

export interface PracticeAttempt {
  id: string;
  questionId: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  selectedAnswer: number;
  selfReportedCorrect: boolean;
  difficulty: DifficultyLevel;
  source: QuestionSource;
  mistakePatternId?: string;
  attemptedAt: string;
  sessionId: string;
}

export interface PracticeSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  reviewMode: ReviewMode;
  attempted: number;
  correct: number;
  incorrect: number;
  mistakeReviewCount: number;
  isActive: boolean;
}

export interface ActivePracticeSession {
  configuration: PracticeConfiguration;
  session: PracticeSession;
  question: Question;
  attempts: PracticeAttempt[];
  selectedAnswer: number | null;
  isCardFlipped: boolean;
}
