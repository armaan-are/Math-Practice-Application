import type { MistakePattern } from './mistake';
import type { DifficultyLevel, MathOperation } from './question';
import type { PracticeAttempt } from './session';

export interface PerformanceStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface AppStatistics extends PerformanceStatistics {
  byOperation: Record<MathOperation, PerformanceStatistics>;
  byDifficulty: Record<DifficultyLevel, PerformanceStatistics>;
}

export interface MistakeReviewStatistics {
  activePatterns: number;
  masteredPatterns: number;
  similarQuestionsPracticed: number;
  reviewQuestionsCorrect: number;
  mostMissedOperations: MathOperation[];
  patternsByFrequency: MistakePattern[];
  recentReviewAttempts: PracticeAttempt[];
}
