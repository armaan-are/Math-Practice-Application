import { Navigate, useLocation } from 'react-router-dom';
import { ButtonLink } from '../components/common/ButtonLink';
import { PageContainer } from '../components/layout/PageContainer';
import { DIFFICULTIES, OPERATIONS } from '../constants/math';
import type { PracticeAttempt, PracticeSession } from '../types';

interface SummaryState {
  session: PracticeSession;
  attempts: PracticeAttempt[];
}

function isSummaryState(value: unknown): value is SummaryState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SummaryState>;
  return (
    !!candidate.session &&
    candidate.session.isActive === false &&
    typeof candidate.session.completedAt === 'string' &&
    Array.isArray(candidate.attempts)
  );
}

export function SessionSummaryPage() {
  const location = useLocation();
  const state = location.state as unknown;

  if (!isSummaryState(state)) return <Navigate to="/practice/setup" replace />;

  const { session } = state;
  const accuracy =
    session.attempted === 0 ? 0 : Math.round((session.correct / session.attempted) * 100);
  const difficulty = DIFFICULTIES.find((item) => item.value === session.difficulty);
  const operationLabels = session.operations.map(
    (operation) =>
      OPERATIONS.find((item) => item.value === operation)?.label ?? operation,
  );

  return (
    <PageContainer>
      <section className="summary-card" aria-labelledby="summary-title">
        <p className="eyebrow">Mission complete</p>
        <h1 id="summary-title">You kept your brain growing!</h1>
        <div className="accuracy-ring" aria-label={`${accuracy}% accuracy`}>
          <strong>{accuracy}%</strong>
          <span>accuracy</span>
        </div>
        <dl className="summary-grid">
          <div>
            <dt>Questions</dt>
            <dd>{session.attempted}</dd>
          </div>
          <div>
            <dt>Right</dt>
            <dd>{session.correct}</dd>
          </div>
          <div>
            <dt>To review</dt>
            <dd>{session.incorrect}</dd>
          </div>
          <div>
            <dt>Mistake review</dt>
            <dd>{session.mistakeReviewCount}</dd>
          </div>
        </dl>
        <div className="summary-details">
          <p>
            <strong>Practiced:</strong> {operationLabels.join(', ')}
          </p>
          <p>
            <strong>Level:</strong> {difficulty?.label ?? `Level ${session.difficulty}`}
          </p>
        </div>
        <div className="summary-actions">
          <ButtonLink to="/practice/setup">Practice again</ButtonLink>
          <ButtonLink to="/practice/setup?mode=mistakes" variant="secondary">
            Practice mistakes
          </ButtonLink>
          <ButtonLink to="/settings" variant="soft">
            Change settings
          </ButtonLink>
          <ButtonLink to="/statistics" variant="soft">
            View statistics
          </ButtonLink>
          <ButtonLink to="/" variant="soft">
            Return home
          </ButtonLink>
        </div>
      </section>
    </PageContainer>
  );
}
