import { useMemo, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { DIFFICULTIES, OPERATIONS } from '../constants/math';
import { accuracy, calculateStatistics } from '../services/statisticsService';
import {
  clearPracticeHistory,
  loadAttempts,
  loadSessions,
} from '../services/storageService';

export function StatisticsPage() {
  const [revision, setRevision] = useState(0);
  const { attempts, sessions, statistics } = useMemo(() => {
    void revision;
    const storedAttempts = loadAttempts();
    return {
      attempts: storedAttempts,
      sessions: loadSessions().sort((a, b) =>
        (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt),
      ),
      statistics: calculateStatistics(storedAttempts),
    };
  }, [revision]);

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
