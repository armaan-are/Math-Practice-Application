import type {
  AppStatistics,
  DifficultyLevel,
  MathOperation,
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
