import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { QuestionCard } from '../components/practice/QuestionCard';
import { generateQuestion } from '../services/questionGenerator';
import {
  generateSimilarQuestion,
  similarQuestionKey,
} from '../services/similarQuestionGenerator';
import type { PracticeConfiguration } from './PracticeSetupPage';
import type {
  MistakePattern,
  PracticeAttempt,
  PracticeSession,
  Question,
} from '../types';
import { createId } from '../utils/ids';
import {
  loadMistakePatterns,
  loadSettings,
  saveAttempt,
  saveMistakePatterns,
  saveSession,
} from '../services/storageService';
import { recordMistakeForAttempt } from '../services/mistakeService';
import {
  activeMistakePatterns,
  selectMistakePattern,
  updatePatternsForReviewAttempt,
} from '../services/mistakeReviewService';

function isConfiguration(value: unknown): value is PracticeConfiguration {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PracticeConfiguration>;
  const allowedOperations = ['addition', 'subtraction', 'multiplication', 'division'];
  return (
    Array.isArray(candidate.operations) &&
    candidate.operations.length > 0 &&
    candidate.operations.every((operation) => allowedOperations.includes(operation)) &&
    [1, 2, 3, 4].includes(candidate.difficulty ?? 0) &&
    [5, 10, 20, 'continuous'].includes(candidate.sessionLength ?? 0) &&
    (candidate.reviewMode === 'regular' || candidate.reviewMode === 'mistake-review')
  );
}

function nextRegularQuestion(
  configuration: PracticeConfiguration,
  previous?: Question,
): Question {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateQuestion(
      configuration.operations,
      configuration.difficulty,
    );
    if (
      !previous ||
      candidate.operation !== previous.operation ||
      candidate.firstOperand !== previous.firstOperand ||
      candidate.secondOperand !== previous.secondOperand
    ) {
      return candidate;
    }
  }
  return generateQuestion(configuration.operations, configuration.difficulty);
}

function nextReviewQuestion(
  configuration: PracticeConfiguration,
  patterns: readonly MistakePattern[],
  masteryThreshold: number,
  previous?: Question,
): Question {
  const eligible = activeMistakePatterns(
    patterns,
    configuration.operations,
    configuration.difficulty,
  );
  const pattern = selectMistakePattern(
    eligible,
    masteryThreshold,
    previous?.mistakePatternId,
  );
  if (!pattern) throw new Error('No active mistake pattern is available.');

  return generateSimilarQuestion(pattern, {
    excludeQuestionKeys: previous ? [similarQuestionKey(previous)] : [],
  });
}

export function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const configuration = location.state as unknown;

  if (!isConfiguration(configuration)) {
    return <Navigate to="/practice/setup" replace />;
  }

  const patterns = activeMistakePatterns(
    loadMistakePatterns(),
    configuration.operations,
    configuration.difficulty,
  );
  if (configuration.reviewMode === 'mistake-review' && patterns.length === 0) {
    return <Navigate to="/practice/setup?mode=mistakes" replace />;
  }

  return (
    <ActivePracticeSession
      configuration={configuration}
      initialPatterns={patterns}
      onNavigate={navigate}
    />
  );
}

interface ActivePracticeSessionProps {
  configuration: PracticeConfiguration;
  initialPatterns: MistakePattern[];
  onNavigate: ReturnType<typeof useNavigate>;
}

function ActivePracticeSession({
  configuration,
  initialPatterns,
  onNavigate,
}: ActivePracticeSessionProps) {
  const [settings] = useState(loadSettings);
  const [patterns, setPatterns] = useState(initialPatterns);
  const [session, setSession] = useState<PracticeSession>(() => ({
    id: createId('session'),
    startedAt: new Date().toISOString(),
    operations: configuration.operations,
    difficulty: configuration.difficulty,
    sessionLength: configuration.sessionLength,
    reviewMode: configuration.reviewMode,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    mistakeReviewCount: 0,
    isActive: true,
  }));
  const [question, setQuestion] = useState<Question>(() =>
    configuration.reviewMode === 'mistake-review'
      ? nextReviewQuestion(configuration, initialPatterns, settings.masteryThreshold)
      : nextRegularQuestion(configuration),
  );
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);

  const finishSession = (
    completedSession: PracticeSession,
    allAttempts: PracticeAttempt[],
  ) => {
    saveSession(completedSession);
    onNavigate('/practice/summary', {
      replace: true,
      state: { session: completedSession, attempts: allAttempts },
    });
  };

  const recordResult = (selfReportedCorrect: boolean, selectedAnswer: number) => {
    const attempt: PracticeAttempt = {
      id: createId('attempt'),
      questionId: question.id,
      operation: question.operation,
      firstOperand: question.firstOperand,
      secondOperand: question.secondOperand,
      correctAnswer: question.correctAnswer,
      selectedAnswer,
      selfReportedCorrect,
      difficulty: question.difficulty,
      source: question.source,
      mistakePatternId: question.mistakePatternId,
      attemptedAt: new Date().toISOString(),
      sessionId: session.id,
    };
    const allAttempts = [...attempts, attempt];
    const updated: PracticeSession = {
      ...session,
      attempted: session.attempted + 1,
      correct: session.correct + (selfReportedCorrect ? 1 : 0),
      incorrect: session.incorrect + (selfReportedCorrect ? 0 : 1),
      mistakeReviewCount:
        session.mistakeReviewCount + (question.source === 'mistake-review' ? 1 : 0),
      operations: session.operations.includes(question.operation)
        ? session.operations
        : [...session.operations, question.operation],
    };

    setAttempts(allAttempts);
    setSession(updated);
    saveAttempt(attempt);
    let updatedPatterns = patterns;
    if (question.source === 'mistake-review') {
      updatedPatterns = updatePatternsForReviewAttempt(
        patterns,
        attempt,
        settings.masteryThreshold,
      );
      setPatterns(updatedPatterns);
      saveMistakePatterns(updatedPatterns);
    } else if (!selfReportedCorrect) {
      recordMistakeForAttempt(attempt);
    }

    if (
      updated.sessionLength !== 'continuous' &&
      updated.attempted >= updated.sessionLength
    ) {
      const completed = {
        ...updated,
        completedAt: new Date().toISOString(),
        isActive: false,
      };
      finishSession(completed, allAttempts);
      return;
    }

    if (configuration.reviewMode === 'mistake-review') {
      const remaining = activeMistakePatterns(
        updatedPatterns,
        configuration.operations,
        configuration.difficulty,
      );
      if (remaining.length === 0) {
        const completed = {
          ...updated,
          completedAt: new Date().toISOString(),
          isActive: false,
        };
        finishSession(completed, allAttempts);
        return;
      }
      setQuestion(
        nextReviewQuestion(configuration, remaining, settings.masteryThreshold, question),
      );
      return;
    }

    setQuestion(nextRegularQuestion(configuration, question));
  };

  const endContinuousSession = () => {
    if (!window.confirm('End this practice session and see your summary?')) return;
    const completed = {
      ...session,
      completedAt: new Date().toISOString(),
      isActive: false,
    };
    finishSession(completed, attempts);
  };

  const progress =
    session.sessionLength === 'continuous'
      ? null
      : Math.round((session.attempted / session.sessionLength) * 100);

  return (
    <PageContainer className="practice-page">
      <div className="session-toolbar">
        <div>
          <span className="session-score session-score--correct">
            {session.correct} right
          </span>
          <span className="session-score session-score--incorrect">
            {session.incorrect} to review
          </span>
        </div>
        {session.sessionLength === 'continuous' && (
          <button className="text-button" onClick={endContinuousSession} type="button">
            End session
          </button>
        )}
      </div>
      {progress !== null && (
        <div
          aria-label={`${progress}% of session complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="progress-track"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <QuestionCard
        animationsEnabled={settings.cardAnimations}
        currentQuestion={session.attempted + 1}
        onResult={recordResult}
        question={question}
        showExplanations={settings.showExplanations}
        totalQuestions={session.sessionLength}
      />
    </PageContainer>
  );
}
