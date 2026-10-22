import { useMemo, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { DIFFICULTIES, OPERATIONS } from '../constants/math';
import {
  accuracy,
  calculateMistakeReviewStatistics,
  calculateStatistics,
} from '../services/statisticsService';
import {
  clearPracticeHistory,
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  loadSettings,
} from '../services/storageService';
import type { MathOperation, MistakePattern, PracticeAttempt } from '../types';

const operationSymbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

function operationLabel(operation: MathOperation): string {
  return OPERATIONS.find(({ value }) => value === operation)?.label ?? operation;
}

function factText(
  fact: Pick<
    MistakePattern,
    'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer'
  >,
): string {
  return `${fact.firstOperand} ${operationSymbols[fact.operation]} ${fact.secondOperand} = ${fact.correctAnswer}`;
}

export function StatisticsPage() {
  const [revision, setRevision] = useState(0);
  const {
    attempts,
    masteryThreshold,
    mistakeStatistics,
    patterns,
    sessions,
    statistics,
  } = useMemo(() => {
    void revision;
    const storedAttempts = loadAttempts();
    const storedPatterns = loadMistakePatterns();
    return {
      attempts: storedAttempts,
      masteryThreshold: loadSettings().masteryThreshold,
      mistakeStatistics: calculateMistakeReviewStatistics(storedPatterns, storedAttempts),
      patterns: storedPatterns,
      sessions: loadSessions().sort((a, b) =>
        (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt),
      ),
      statistics: calculateStatistics(storedAttempts),
    };
  }, [revision]);

  const activePatterns = mistakeStatistics.patternsByFrequency.filter(
    (pattern) => !pattern.mastered,
  );
  const masteredPatterns = mistakeStatistics.patternsByFrequency.filter(
    (pattern) => pattern.mastered,
  );

  const reset = () => {
    if (
      !window.confirm(
        'Are you sure you want to erase all practice history and statistics?',
      )
    )
      return;
    clearPracticeHistory();
    setRevision((value) => value + 1);
  };

  return (
    <PageContainer>
      <div className="page-heading">
        <p className="eyebrow">Your progress</p>
        <h1>Every answer helps you grow</h1>
        <p>Practice history stays on this browser and device.</p>
      </div>

      {attempts.length === 0 ? (
        <section className="empty-state">
          <h2>Your first stats are waiting</h2>
          <p>Finish a practice question and come back to see your progress.</p>
        </section>
      ) : (
        <>
          <section className="stats-overview" aria-label="Overall statistics">
            <StatCard label="Attempted" value={statistics.attempted} />
            <StatCard label="Correct" value={statistics.correct} />
            <StatCard label="To review" value={statistics.incorrect} />
            <StatCard label="Accuracy" value={`${accuracy(statistics)}%`} />
          </section>
          <section className="stats-section">
            <h2>By operation</h2>
            <div className="stats-card-grid">
              {OPERATIONS.map((operation) => (
                <PerformanceCard
                  key={operation.value}
                  label={`${operation.symbol} ${operation.label}`}
                  stats={statistics.byOperation[operation.value]}
                />
              ))}
            </div>
          </section>
          <section className="stats-section">
            <h2>By difficulty</h2>
            <div className="stats-card-grid">
              {DIFFICULTIES.map((level) => (
                <PerformanceCard
                  key={level.value}
                  label={`Level ${level.value}: ${level.label}`}
                  stats={statistics.byDifficulty[level.value]}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="stats-section" aria-labelledby="mistake-stats-title">
        <h2 id="mistake-stats-title">Mistake review</h2>
        {patterns.length === 0 ? (
          <p className="empty-inline">
            No mistake patterns yet. Answers marked wrong will appear here for extra
            practice.
          </p>
        ) : (
          <>
            <div className="stats-overview" aria-label="Mistake-review statistics">
              <StatCard
                label="Active patterns"
                value={mistakeStatistics.activePatterns}
              />
              <StatCard
                label="Mastered patterns"
                value={mistakeStatistics.masteredPatterns}
              />
              <StatCard
                label="Similar practiced"
                value={mistakeStatistics.similarQuestionsPracticed}
              />
              <StatCard
                label="Review answers right"
                value={mistakeStatistics.reviewQuestionsCorrect}
              />
            </div>

            <div className="missed-summary">
              <h3>Frequently missed facts</h3>
              <p>
                <strong>Most missed operation:</strong>{' '}
                {mistakeStatistics.mostMissedOperations.map(operationLabel).join(' and ')}
              </p>
              <ol className="fact-ranking">
                {mistakeStatistics.patternsByFrequency.slice(0, 5).map((pattern) => (
                  <li key={pattern.id}>
                    <strong>{factText(pattern)}</strong>
                    <span>
                      {pattern.incorrectCount}{' '}
                      {pattern.incorrectCount === 1 ? 'miss' : 'misses'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pattern-columns">
              <PatternList
                emptyMessage="No active patterns—nice work!"
                masteryThreshold={masteryThreshold}
                patterns={activePatterns}
                title="Active patterns"
              />
              <PatternList
                emptyMessage="No mastered patterns yet."
                masteryThreshold={masteryThreshold}
                patterns={masteredPatterns}
                title="Mastered patterns"
              />
            </div>
          </>
        )}
      </section>

      <section className="stats-section">
        <h2>Recent mistake review</h2>
        {mistakeStatistics.recentReviewAttempts.length === 0 ? (
          <p className="empty-inline">No similar-question history yet.</p>
        ) : (
          <div className="recent-sessions review-history">
            {mistakeStatistics.recentReviewAttempts.slice(0, 10).map((attempt) => (
              <ReviewHistoryItem attempt={attempt} key={attempt.id} />
            ))}
          </div>
        )}
      </section>

      <section className="stats-section">
        <h2>Recent sessions</h2>
        {sessions.length === 0 ? (
          <p className="empty-inline">No completed sessions yet.</p>
        ) : (
          <div className="recent-sessions">
            {sessions.slice(0, 10).map((session) => (
              <article key={session.id}>
                <div>
                  <strong>
                    {new Date(
                      session.completedAt ?? session.startedAt,
                    ).toLocaleDateString()}
                  </strong>
                  <span>
                    {session.operations.join(', ')} · Level {session.difficulty}
                  </span>
                </div>
                <div>
                  <strong>{accuracy(session)}%</strong>
                  <span>
                    {session.correct} right · {session.incorrect} to review
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <button className="button button--supportive" onClick={reset} type="button">
        Reset statistics
      </button>
    </PageContainer>
  );
}

function PatternList({
  emptyMessage,
  masteryThreshold,
  patterns,
  title,
}: {
  emptyMessage: string;
  masteryThreshold: number;
  patterns: MistakePattern[];
  title: string;
}) {
  const headingId = `${title.toLowerCase().replaceAll(' ', '-')}-title`;

  return (
    <section aria-labelledby={headingId} className="pattern-list">
      <h3 id={headingId}>{title}</h3>
      {patterns.length === 0 ? (
        <p className="empty-inline">{emptyMessage}</p>
      ) : (
        patterns.map((pattern) => (
          <article key={pattern.id}>
            <strong>{factText(pattern)}</strong>
            <span>
              {pattern.incorrectCount} {pattern.incorrectCount === 1 ? 'miss' : 'misses'}{' '}
              · {pattern.similarCorrectCount} of {masteryThreshold} review answers right
            </span>
            <span>
              Last missed:{' '}
              <time dateTime={pattern.lastIncorrectAt}>
                {new Date(pattern.lastIncorrectAt).toLocaleDateString()}
              </time>
            </span>
          </article>
        ))
      )}
    </section>
  );
}

function ReviewHistoryItem({ attempt }: { attempt: PracticeAttempt }) {
  return (
    <article>
      <div>
        <strong>{factText(attempt)}</strong>
        <span>
          <time dateTime={attempt.attemptedAt}>
            {new Date(attempt.attemptedAt).toLocaleDateString()}
          </time>{' '}
          · Level {attempt.difficulty}
        </span>
      </div>
      <div>
        <strong>{attempt.selfReportedCorrect ? 'Right' : 'Keep practicing'}</strong>
        <span>Similar question</span>
      </div>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PerformanceCard({
  label,
  stats,
}: {
  label: string;
  stats: { attempted: number; correct: number; incorrect: number };
}) {
  return (
    <article className="performance-card">
      <h3>{label}</h3>
      <strong>{accuracy(stats)}%</strong>
      <p>
        {stats.attempted} attempted · {stats.correct} right · {stats.incorrect} to review
      </p>
    </article>
  );
}
