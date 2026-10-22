import type {
  DifficultyLevel,
  MathOperation,
  MistakePattern,
  PracticeAttempt,
} from '../types';
import { updateMistakePatterns } from './mistakeService';
import { loadMistakePatterns, saveMistakePatterns } from './storageService';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function activeMistakePatterns(
  patterns: readonly MistakePattern[],
  operations?: readonly MathOperation[],
  difficulty?: DifficultyLevel,
): MistakePattern[] {
  return patterns.filter(
    (pattern) =>
      !pattern.mastered &&
      (!operations || operations.includes(pattern.operation)) &&
      (difficulty === undefined || pattern.difficulty === difficulty),
  );
}

export function mistakeReviewPriority(
  pattern: MistakePattern,
  masteryThreshold: number,
  now = Date.now(),
): number {
  const ageInDays = Math.max(
    0,
    Math.floor((now - Date.parse(pattern.lastIncorrectAt)) / DAY_IN_MILLISECONDS),
  );
  const recencyScore = Math.max(0, 30 - ageInDays);
  const practiceNeeded = Math.max(0, masteryThreshold - pattern.similarCorrectCount);

  return pattern.incorrectCount * 100 + recencyScore + practiceNeeded * 10;
}

export function prioritizeMistakePatterns(
  patterns: readonly MistakePattern[],
  masteryThreshold: number,
  now = Date.now(),
  random: () => number = Math.random,
): MistakePattern[] {
  return activeMistakePatterns(patterns)
    .map((pattern) => ({
      pattern,
      priority: mistakeReviewPriority(pattern, masteryThreshold, now),
      tieBreaker: random(),
    }))
    .sort(
      (first, second) =>
        second.priority - first.priority || first.tieBreaker - second.tieBreaker,
    )
    .map(({ pattern }) => pattern);
}

export function selectMistakePattern(
  patterns: readonly MistakePattern[],
  masteryThreshold: number,
  previousPatternId?: string,
  now = Date.now(),
  random: () => number = Math.random,
): MistakePattern | null {
  const active = activeMistakePatterns(patterns);
  const candidates =
    active.length > 1
      ? active.filter((pattern) => pattern.id !== previousPatternId)
      : active;

  return prioritizeMistakePatterns(candidates, masteryThreshold, now, random)[0] ?? null;
}

export function updateReviewProgress(
  patterns: readonly MistakePattern[],
  patternId: string,
  selfReportedCorrect: boolean,
  masteryThreshold: number,
): MistakePattern[] {
  return patterns.map((pattern) => {
    if (pattern.id !== patternId) return pattern;
    const similarCorrectCount =
      pattern.similarCorrectCount + (selfReportedCorrect ? 1 : 0);

    return {
      ...pattern,
      similarAttemptCount: pattern.similarAttemptCount + 1,
      similarCorrectCount,
      mastered: similarCorrectCount >= masteryThreshold,
    };
  });
}

export function updatePatternsForReviewAttempt(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
  masteryThreshold: number,
): MistakePattern[] {
  if (attempt.source !== 'mistake-review' || !attempt.mistakePatternId) {
    return [...patterns];
  }

  const withNewMistake = attempt.selfReportedCorrect
    ? [...patterns]
    : updateMistakePatterns(patterns, attempt);

  return updateReviewProgress(
    withNewMistake,
    attempt.mistakePatternId,
    attempt.selfReportedCorrect,
    masteryThreshold,
  );
}

export function recordReviewAttempt(
  attempt: PracticeAttempt,
  masteryThreshold: number,
): MistakePattern[] {
  const updated = updatePatternsForReviewAttempt(
    loadMistakePatterns(),
    attempt,
    masteryThreshold,
  );
  saveMistakePatterns(updated);
  return updated;
}
