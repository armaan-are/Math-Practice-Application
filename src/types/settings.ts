import type { DifficultyLevel, MathOperation } from './question';
import type { SessionLength } from './session';

export interface AppSettings {
  soundEffects: boolean;
  cardAnimations: boolean;
  showExplanations: boolean;
  positiveFeedback: boolean;
  defaultSessionLength: SessionLength;
  defaultDifficulty: DifficultyLevel;
  defaultOperations: MathOperation[];
  masteryThreshold: number;
}
