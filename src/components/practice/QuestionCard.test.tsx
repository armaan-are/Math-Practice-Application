import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Question } from '../../types';
import { QuestionCard } from './QuestionCard';

const question: Question = {
  id: 'question-1',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8 = ?',
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 2,
  source: 'regular',
};

describe('QuestionCard', () => {
  it('requires a selection, permits changes, and reveals the answer', async () => {
    const user = userEvent.setup();
    render(
      <QuestionCard
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );

    const flip = screen.getByRole('button', { name: 'Flip card' });
    expect(flip).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Answer 1: 48' }));
    await user.click(screen.getByRole('button', { name: 'Answer 3: 56' }));
    expect(
      screen.getByRole('button', { name: /answer 3: 56, selected/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    await user.click(flip);
    expect(screen.getByText('Correct answer')).toBeInTheDocument();
    expect(screen.getByText('Your answer')).toBeInTheDocument();
    expect(screen.getByText(/7 × 8 = 56/)).toBeInTheDocument();
  });

  it('submits a self-reported result at most once', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <QuestionCard
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={onResult}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Answer 1: 48' }));
    await user.click(screen.getByRole('button', { name: 'Flip card' }));
    const wrong = screen.getByRole('button', { name: 'I got it wrong' });
    await user.dblClick(wrong);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(false, 48);
  });

  it('resets selection and flip state for a new question', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <QuestionCard
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Answer 1: 48' }));
    await user.click(screen.getByRole('button', { name: 'Flip card' }));

    rerender(
      <QuestionCard
        question={{ ...question, id: 'question-2', displayText: '8 × 8 = ?' }}
        currentQuestion={2}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Flip card' })).toBeDisabled();
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument();
  });
});
