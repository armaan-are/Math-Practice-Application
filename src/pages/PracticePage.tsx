import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { QuestionCard } from '../components/practice/QuestionCard';
import { generateQuestion } from '../services/questionGenerator';
import type { PracticeConfiguration } from './PracticeSetupPage';
import type { PracticeAttempt, PracticeSession, Question } from '../types';
import { createId } from '../utils/ids';
import { loadSettings, saveAttempt, saveSession } from '../services/storageService';

function isConfiguration(value: unknown): value is PracticeConfiguration {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PracticeConfiguration>;
  const allowedOperations = ['addition', 'subtraction', 'multiplication', 'division'];
  return (
    Array.isArray(candidate.operations) &&
    candidate.operations.length > 0 &&
    candidate.operations.every((operation) => allowedOperations.includes(operation)) &&
    [1, 2, 3, 4].includes(candidate.difficulty ?? 0) &&
    [5, 10, 20, 'continuous'].includes(candidate.sessionLength ?? 0)
  );
}

function nextQuestion(
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

export function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const configuration = location.state as unknown;

  if (!isConfiguration(configuration)) {
    return <Navigate to="/practice/setup" replace />;
  }

  return <ActivePracticeSession configuration={configuration} onNavigate={navigate} />;
}

interface ActivePracticeSessionProps {
  configuration: PracticeConfiguration;
  onNavigate: ReturnType<typeof useNavigate>;
}

function ActivePracticeSession({
  configuration,
  onNavigate,
}: ActivePracticeSessionProps) {
  const [settings] = useState(loadSettings);
  const [session, setSession] = useState<PracticeSession>(() => ({
    id: createId('session'),
    startedAt: new Date().toISOString(),
    operations: configuration.operations,
    difficulty: configuration.difficulty,
    sessionLength: configuration.sessionLength,
    reviewMode: 'regular',
    attempted: 0,
    correct: 0,
    incorrect: 0,
    mistakeReviewCount: 0,
    isActive: true,
  }));
  const [question, setQuestion] = useState<Question>(() => nextQuestion(configuration));
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
    };

    setAttempts(allAttempts);
    setSession(updated);
    saveAttempt(attempt);

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

    setQuestion(nextQuestion(configuration, question));
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
