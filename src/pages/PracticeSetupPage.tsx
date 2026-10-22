import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DifficultySelector } from '../components/setup/DifficultySelector';
import { OperationSelector } from '../components/setup/OperationSelector';
import { SessionLengthSelector } from '../components/setup/SessionLengthSelector';
import { PageContainer } from '../components/layout/PageContainer';
import type { DifficultyLevel, MathOperation, ReviewMode, SessionLength } from '../types';
import { loadMistakePatterns, loadSettings } from '../services/storageService';
import { activeMistakePatterns } from '../services/mistakeReviewService';

export interface PracticeConfiguration {
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  reviewMode: ReviewMode;
}

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [defaults] = useState(loadSettings);
  const [mistakePatterns] = useState(loadMistakePatterns);
  const [operations, setOperations] = useState<MathOperation[]>(
    defaults.defaultOperations,
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    defaults.defaultDifficulty,
  );
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    defaults.defaultSessionLength,
  );
  const defaultActiveMistakes = activeMistakePatterns(
    mistakePatterns,
    defaults.defaultOperations,
    defaults.defaultDifficulty,
  );
  const [reviewMode, setReviewMode] = useState<ReviewMode>(() =>
    searchParams.get('mode') === 'mistakes' && defaultActiveMistakes.length > 0
      ? 'mistake-review'
      : 'regular',
  );
  const [showValidation, setShowValidation] = useState(false);
  const activeMistakes = activeMistakePatterns(mistakePatterns, operations, difficulty);

  const startSession = () => {
    if (operations.length === 0) {
      setShowValidation(true);
      return;
    }

    navigate('/practice/session', {
      state: {
        operations,
        difficulty,
        sessionLength,
        reviewMode,
      } satisfies PracticeConfiguration,
    });
  };

  const updateOperations = (next: MathOperation[]) => {
    setOperations(next);
    if (activeMistakePatterns(mistakePatterns, next, difficulty).length === 0) {
      setReviewMode('regular');
    }
    if (next.length > 0) setShowValidation(false);
  };

  const updateDifficulty = (next: DifficultyLevel) => {
    setDifficulty(next);
    if (activeMistakePatterns(mistakePatterns, operations, next).length === 0) {
      setReviewMode('regular');
    }
  };

  return (
    <PageContainer>
      <section className="setup-page" aria-labelledby="setup-title">
        <div className="page-heading">
          <p className="eyebrow">Practice setup</p>
          <h1 id="setup-title">Choose your math mission</h1>
          <p>A few quick choices, then you are ready to solve.</p>
        </div>
        <OperationSelector selected={operations} onChange={updateOperations} />
        <DifficultySelector selected={difficulty} onChange={updateDifficulty} />
        <fieldset className="setup-group">
          <legend>Choose your practice type</legend>
          <div className="segmented-control segmented-control--two">
            <label>
              <input
                checked={reviewMode === 'regular'}
                name="reviewMode"
                onChange={() => setReviewMode('regular')}
                type="radio"
              />
              <span>Regular practice</span>
            </label>
            <label>
              <input
                aria-describedby="mistake-review-status"
                checked={reviewMode === 'mistake-review'}
                disabled={activeMistakes.length === 0}
                name="reviewMode"
                onChange={() => setReviewMode('mistake-review')}
                type="radio"
              />
              <span>Practice mistakes</span>
            </label>
          </div>
          <p className="field-help review-status" id="mistake-review-status">
            {activeMistakes.length > 0
              ? `${activeMistakes.length} active mistake ${activeMistakes.length === 1 ? 'pattern is' : 'patterns are'} ready for these choices.`
              : 'Practice mistakes becomes available after you mark an answer wrong for these choices.'}
          </p>
        </fieldset>
        <SessionLengthSelector selected={sessionLength} onChange={setSessionLength} />
        {showValidation && (
          <p className="validation-message" role="alert">
            Choose at least one kind of math to begin.
          </p>
        )}
        <button
          className="button button--primary setup-submit"
          disabled={operations.length === 0}
          onClick={startSession}
          type="button"
        >
          Start session
        </button>
      </section>
    </PageContainer>
  );
}
