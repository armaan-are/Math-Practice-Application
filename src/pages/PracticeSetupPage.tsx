import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DifficultySelector } from '../components/setup/DifficultySelector';
import { OperationSelector } from '../components/setup/OperationSelector';
import { SessionLengthSelector } from '../components/setup/SessionLengthSelector';
import { PageContainer } from '../components/layout/PageContainer';
import type { DifficultyLevel, MathOperation, SessionLength } from '../types';
import { loadSettings } from '../services/storageService';

export interface PracticeConfiguration {
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
}

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [defaults] = useState(loadSettings);
  const [operations, setOperations] = useState<MathOperation[]>(
    defaults.defaultOperations,
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    defaults.defaultDifficulty,
  );
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    defaults.defaultSessionLength,
  );
  const [showValidation, setShowValidation] = useState(false);

  const startSession = () => {
    if (operations.length === 0) {
      setShowValidation(true);
      return;
    }

    navigate('/practice/session', {
      state: { operations, difficulty, sessionLength } satisfies PracticeConfiguration,
    });
  };

  const updateOperations = (next: MathOperation[]) => {
    setOperations(next);
    if (next.length > 0) setShowValidation(false);
  };

  return (
    <PageContainer>
      <section className="setup-page" aria-labelledby="setup-title">
        <div className="page-heading">
          <p className="eyebrow">Practice setup</p>
          <h1 id="setup-title">Choose your math mission</h1>
          <p>Three quick choices, then you are ready to solve.</p>
        </div>
        <OperationSelector selected={operations} onChange={updateOperations} />
        <DifficultySelector selected={difficulty} onChange={setDifficulty} />
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
