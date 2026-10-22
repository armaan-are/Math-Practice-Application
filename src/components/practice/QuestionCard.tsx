import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../types';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { AnswerChoice } from './AnswerChoice';

interface QuestionCardProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number | 'continuous';
  animationsEnabled?: boolean;
  showExplanations?: boolean;
  onResult: (selfReportedCorrect: boolean, selectedAnswer: number) => void;
}

function getExplanation(question: Question): string {
  const { firstOperand: first, secondOperand: second, operation } = question;
  switch (operation) {
    case 'addition':
      return `Put ${first} and ${second} together to get ${first + second}.`;
    case 'subtraction':
      return `Take ${second} away from ${first} to get ${first - second}.`;
    case 'multiplication':
      return `${first} groups of ${second} make ${first * second}.`;
    case 'division':
      return `Split ${first} into groups of ${second} to make ${first / second} groups.`;
  }
}

function getSpokenQuestion(question: Question, includeAnswer = false): string {
  const operation = {
    addition: 'plus',
    subtraction: 'minus',
    multiplication: 'multiplied by',
    division: 'divided by',
  }[question.operation];
  const ending = includeAnswer ? question.correctAnswer : 'what';
  return `${question.firstOperand} ${operation} ${question.secondOperand} equals ${ending}`;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable)
  );
}

function QuestionCardContent({
  question,
  currentQuestion,
  totalQuestions,
  animationsEnabled = true,
  showExplanations = true,
  onResult,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitted = useRef(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const revealedHeading = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animationsEnabled && !prefersReducedMotion;

  useEffect(() => {
    questionHeading.current?.focus();
  }, [question.id]);

  useEffect(() => {
    if (isCardFlipped) revealedHeading.current?.focus();
  }, [isCardFlipped]);

  useEffect(() => {
    const handleNumberShortcut = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target) ||
        isCardFlipped ||
        isSubmitted
      ) {
        return;
      }

      const index = Number(event.key) - 1;
      if (index < 0 || index > 3 || index >= question.choices.length) return;
      event.preventDefault();
      setSelectedAnswer(question.choices[index]);
    };

    window.addEventListener('keydown', handleNumberShortcut);
    return () => window.removeEventListener('keydown', handleNumberShortcut);
  }, [isCardFlipped, isSubmitted, question.choices]);

  const submitResult = (selfReportedCorrect: boolean) => {
    if (submitted.current || selectedAnswer === null || !isCardFlipped) return;
    submitted.current = true;
    setIsSubmitted(true);
    onResult(selfReportedCorrect, selectedAnswer);
  };

  const totalLabel =
    totalQuestions === 'continuous' ? 'continuous practice' : totalQuestions;

  return (
    <article
      aria-label={`Question ${currentQuestion} of ${totalLabel}`}
      className={`question-card${isCardFlipped ? ' question-card--flipped' : ''}${shouldAnimate ? '' : ' question-card--no-motion'}`}
      data-motion={shouldAnimate ? 'enabled' : 'reduced'}
    >
      <div className="question-card__meta">
        <span>
          Question {currentQuestion}
          {totalQuestions !== 'continuous' ? ` of ${totalQuestions}` : ''}
        </span>
        <span>{isCardFlipped ? 'Answer revealed' : 'Choose one answer'}</span>
      </div>

      {!isCardFlipped ? (
        <div className="question-card__face question-card__front">
          <p
            aria-label="Question announcement"
            aria-live="polite"
            className="visually-hidden"
            role="status"
          >
            Question {currentQuestion}
            {totalQuestions !== 'continuous' ? ` of ${totalQuestions}` : ''}.{' '}
            {getSpokenQuestion(question)}. Choose an answer.
          </p>
          <h1
            aria-label={getSpokenQuestion(question)}
            className="math-question"
            ref={questionHeading}
            tabIndex={-1}
          >
            {question.displayText}
          </h1>
          <div className="answer-grid" aria-label="Answer choices">
            {question.choices.map((answer, index) => (
              <AnswerChoice
                answer={answer}
                disabled={isCardFlipped}
                index={index}
                isSelected={selectedAnswer === answer}
                key={answer}
                onSelect={setSelectedAnswer}
              />
            ))}
          </div>
          <button
            aria-expanded={false}
            className="button button--primary card-action"
            disabled={selectedAnswer === null}
            onClick={() => setIsCardFlipped(true)}
            type="button"
          >
            Flip card
          </button>
        </div>
      ) : (
        <div className="question-card__face question-card__back">
          <p
            aria-label="Answer announcement"
            aria-live="assertive"
            className="visually-hidden"
            role="status"
          >
            Correct answer: {question.correctAnswer}. Your answer: {selectedAnswer}.
            Choose how you did.
          </p>
          <p className="eyebrow">Here is the answer</p>
          <h1
            aria-label={getSpokenQuestion(question, true)}
            className="math-question math-question--answer"
            ref={revealedHeading}
            tabIndex={-1}
          >
            {question.displayText.replace('?', String(question.correctAnswer))}
          </h1>
          <div className="answer-recap">
            <p>
              <span>Correct answer</span>
              <strong>{question.correctAnswer}</strong>
            </p>
            <p>
              <span>Your answer</span>
              <strong>{selectedAnswer}</strong>
            </p>
          </div>
          {showExplanations && <p className="explanation">{getExplanation(question)}</p>}
          <fieldset className="self-report">
            <legend>How did you do?</legend>
            <p>Be honest with yourself—every answer helps you learn.</p>
            <div className="button-row">
              <button
                className="button button--success"
                disabled={isSubmitted}
                onClick={() => submitResult(true)}
                type="button"
              >
                I got it right
              </button>
              <button
                className="button button--supportive"
                disabled={isSubmitted}
                onClick={() => submitResult(false)}
                type="button"
              >
                I got it wrong
              </button>
            </div>
          </fieldset>
        </div>
      )}
    </article>
  );
}

export function QuestionCard(props: QuestionCardProps) {
  return <QuestionCardContent key={props.question.id} {...props} />;
}
