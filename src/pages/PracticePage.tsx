import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { QuestionCard } from '../components/practice/QuestionCard';
import { generateQuestion } from '../services/questionGenerator';
import {
  generateSimilarQuestion,
  similarQuestionKey,
} from '../services/similarQuestionGenerator';
import type {
  ActivePracticeSession,
  MistakePattern,
  PracticeAttempt,
  PracticeConfiguration,
  PracticeSession,
  Question,
} from '../types';
import { createId } from '../utils/ids';
import {
  clearActiveSession,
  loadActiveSession,
  loadMistakePatterns,
  loadSettings,
  saveActiveSession,
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

const positiveMessages = [
  'Nice work! Your math brain is getting stronger.',
  'Great job! Keep that momentum going.',
  'You got it! Ready for the next challenge?',
];

const supportiveMessages = [
  'Good effort! This fact will come back for more practice.',
  'Mistakes help your brain grow. Let’s try another one!',
  'Keep going—you are learning with every answer.',
];

function feedbackMessage(correct: boolean): string {
  const messages = correct ? positiveMessages : supportiveMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

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
  const routeConfiguration = location.state as unknown;
  const recoveredSession = isConfiguration(routeConfiguration)
    ? null
    : loadActiveSession();
  const configuration = isConfiguration(routeConfiguration)
    ? routeConfiguration
    : recoveredSession?.configuration;

  if (!configuration) {
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
      recoveredSession={recoveredSession}
      onNavigate={navigate}
    />
  );
}

interface ActivePracticeSessionProps {
  configuration: PracticeConfiguration;
  initialPatterns: MistakePattern[];
  recoveredSession: ActivePracticeSession | null;
  onNavigate: ReturnType<typeof useNavigate>;
}

function ActivePracticeSession({
  configuration,
  initialPatterns,
  recoveredSession,
  onNavigate,
}: ActivePracticeSessionProps) {
  const [settings] = useState(loadSettings);
  const sessionIsEnding = useRef(false);
  const [patterns, setPatterns] = useState(initialPatterns);
  const [session, setSession] = useState<PracticeSession>(
    () =>
      recoveredSession?.session ?? {
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
      },
  );
  const [question, setQuestion] = useState<Question>(
    () =>
      recoveredSession?.question ??
      (configuration.reviewMode === 'mistake-review'
        ? nextReviewQuestion(configuration, initialPatterns, settings.masteryThreshold)
        : nextRegularQuestion(configuration)),
  );
  const [attempts, setAttempts] = useState<PracticeAttempt[]>(
    recoveredSession?.attempts ?? [],
  );
  const [cardProgress, setCardProgress] = useState(() => ({
    selectedAnswer: recoveredSession?.selectedAnswer ?? null,
    isCardFlipped: recoveredSession?.isCardFlipped ?? false,
  }));
  const [feedback, setFeedback] = useState<{
    kind: 'positive' | 'supportive';
    message: string;
  } | null>(null);

  const finishSession = (
    completedSession: PracticeSession,
    allAttempts: PracticeAttempt[],
  ) => {
    sessionIsEnding.current = true;
    clearActiveSession();
    saveSession(completedSession);
    onNavigate('/practice/summary', {
      replace: true,
      state: { session: completedSession, attempts: allAttempts },
    });
  };

  const endSessionForNavigation = useCallback(() => {
    sessionIsEnding.current = true;
    clearActiveSession();
    saveSession({
      ...session,
      completedAt: new Date().toISOString(),
      isActive: false,
    });
  }, [session]);

  useEffect(() => {
    if (sessionIsEnding.current) return;
    saveActiveSession({
      configuration,
      session,
      question,
      attempts,
      selectedAnswer: cardProgress.selectedAnswer,
      isCardFlipped: cardProgress.isCardFlipped,
    });
  }, [attempts, cardProgress, configuration, question, session]);

  useActiveSessionNavigationGuard(endSessionForNavigation);

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
    if (settings.positiveFeedback) {
      setFeedback({
        kind: selfReportedCorrect ? 'positive' : 'supportive',
        message: feedbackMessage(selfReportedCorrect),
      });
    }
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
      setCardProgress({ selectedAnswer: null, isCardFlipped: false });
      return;
    }

    setQuestion(nextRegularQuestion(configuration, question));
    setCardProgress({ selectedAnswer: null, isCardFlipped: false });
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
      <p
        aria-label="Session progress announcement"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        Question {session.attempted + 1}
        {session.sessionLength === 'continuous'
          ? ' in continuous practice'
          : ` of ${session.sessionLength}`}
        . {session.correct} right and {session.incorrect} to review.
      </p>
      {feedback && (
        <p
          aria-label="Practice feedback"
          aria-live="polite"
          className={`practice-feedback practice-feedback--${feedback.kind}`}
          role="status"
        >
          <span aria-hidden="true">{feedback.kind === 'positive' ? '★' : '♥'}</span>
          {feedback.message}
        </p>
      )}
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
        initialFlipped={cardProgress.isCardFlipped}
        initialSelectedAnswer={cardProgress.selectedAnswer}
        onProgressChange={(selectedAnswer, isCardFlipped) =>
          setCardProgress({ selectedAnswer, isCardFlipped })
        }
        onResult={recordResult}
        question={question}
        showExplanations={settings.showExplanations}
        totalQuestions={session.sessionLength}
      />
    </PageContainer>
  );
}

function useActiveSessionNavigationGuard(onConfirmedLeave: () => void) {
  const restoringHistory = useRef(false);

  useEffect(() => {
    const message = 'End this practice session and leave the page?';
    const confirmLeave = () => window.confirm(message);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        `${destination.pathname}${destination.search}` ===
          `${window.location.pathname}${window.location.search}`
      ) {
        return;
      }
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onConfirmedLeave();
    };
    const handlePopState = () => {
      if (restoringHistory.current) {
        restoringHistory.current = false;
        return;
      }
      if (confirmLeave()) {
        onConfirmedLeave();
      } else {
        restoringHistory.current = true;
        window.history.forward();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [onConfirmedLeave]);
}
