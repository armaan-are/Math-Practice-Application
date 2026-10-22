import type { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  cardAnimations: true,
  showExplanations: true,
  positiveFeedback: true,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ['addition'],
  masteryThreshold: 3,
};
