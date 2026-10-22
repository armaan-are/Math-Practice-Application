import type { DifficultyLevel, MathOperation } from './question';

export interface PerformanceStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface AppStatistics extends PerformanceStatistics {
  byOperation: Record<MathOperation, PerformanceStatistics>;
  byDifficulty: Record<DifficultyLevel, PerformanceStatistics>;
}
