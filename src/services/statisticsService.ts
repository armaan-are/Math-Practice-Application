import type {
  AppStatistics,
  DifficultyLevel,
  MathOperation,
  MistakePattern,
  MistakeReviewStatistics,
  PerformanceStatistics,
  PracticeAttempt,
} from '../types';

const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];
const difficulties: DifficultyLevel[] = [1, 2, 3, 4];

const empty = (): PerformanceStatistics => ({ attempted: 0, correct: 0, incorrect: 0 });

export function calculateStatistics(attempts: readonly PracticeAttempt[]): AppStatistics {
  const statistics: AppStatistics = {
    ...empty(),
    byOperation: Object.fromEntries(operations.map((item) => [item, empty()])) as Record<
      MathOperation,
      PerformanceStatistics
    >,
    byDifficulty: Object.fromEntries(
      difficulties.map((item) => [item, empty()]),
    ) as Record<DifficultyLevel, PerformanceStatistics>,
  };

  for (const attempt of attempts) {
    const targets = [
      statistics,
      statistics.byOperation[attempt.operation],
      statistics.byDifficulty[attempt.difficulty],
    ];
    for (const target of targets) {
      target.attempted += 1;
      target.correct += attempt.selfReportedCorrect ? 1 : 0;
      target.incorrect += attempt.selfReportedCorrect ? 0 : 1;
    }
  }
  return statistics;
}

export function accuracy(statistics: PerformanceStatistics): number {
  return statistics.attempted === 0
    ? 0
    : Math.round((statistics.correct / statistics.attempted) * 100);
}

export function calculateMistakeReviewStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
): MistakeReviewStatistics {
  const missedByOperation = Object.fromEntries(
    operations.map((operation) => [operation, 0]),
  ) as Record<MathOperation, number>;

  for (const pattern of patterns) {
    missedByOperation[pattern.operation] += pattern.incorrectCount;
  }

  const largestMissedTotal = Math.max(0, ...Object.values(missedByOperation));
  const reviewAttempts = attempts
    .filter((attempt) => attempt.source === 'mistake-review')
    .sort((first, second) => second.attemptedAt.localeCompare(first.attemptedAt));

  return {
    activePatterns: patterns.filter((pattern) => !pattern.mastered).length,
    masteredPatterns: patterns.filter((pattern) => pattern.mastered).length,
    similarQuestionsPracticed: reviewAttempts.length,
    reviewQuestionsCorrect: reviewAttempts.filter(
      (attempt) => attempt.selfReportedCorrect,
    ).length,
    mostMissedOperations:
      largestMissedTotal === 0
        ? []
        : operations.filter(
            (operation) => missedByOperation[operation] === largestMissedTotal,
          ),
    patternsByFrequency: [...patterns].sort(
      (first, second) =>
        second.incorrectCount - first.incorrectCount ||
        second.lastIncorrectAt.localeCompare(first.lastIncorrectAt) ||
        first.id.localeCompare(second.id),
    ),
    recentReviewAttempts: reviewAttempts,
  };
}
