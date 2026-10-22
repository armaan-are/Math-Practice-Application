import { useRef, useState } from 'react';
import type { Question } from '../../types';
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
      className={`question-card${isCardFlipped ? ' question-card--flipped' : ''}${animationsEnabled ? '' : ' question-card--no-motion'}`}
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
          <h1 className="math-question">{question.displayText}</h1>
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
        <div className="question-card__face question-card__back" aria-live="polite">
          <p className="eyebrow">Here is the answer</p>
          <h1 className="math-question math-question--answer">
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
