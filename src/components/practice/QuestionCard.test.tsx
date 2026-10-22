import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => vi.unstubAllGlobals());

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
        question={{
          ...question,
          id: 'question-2',
          firstOperand: 8,
          secondOperand: 8,
          displayText: '8 × 8 = ?',
          correctAnswer: 64,
        }}
        currentQuestion={2}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Flip card' })).toBeDisabled();
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /8 multiplied by 8/i })).toHaveFocus();
  });

  it('restores a saved selection and revealed card state', () => {
    render(
      <QuestionCard
        initialFlipped
        initialSelectedAnswer={48}
        question={question}
        currentQuestion={2}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /equals 56/i })).toBeInTheDocument();
    expect(screen.getByText('Your answer').nextElementSibling).toHaveTextContent('48');
    expect(screen.getByRole('button', { name: 'I got it wrong' })).toBeEnabled();
  });

  it('uses native tabbable buttons and answer shortcuts 1 through 4', async () => {
    const user = userEvent.setup();
    render(
      <QuestionCard
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );

    const heading = screen.getByRole('heading', { name: /7 multiplied by 8/i });
    expect(heading).toHaveFocus();
    for (let index = 1; index <= 4; index += 1) {
      const answer = screen.getByRole('button', {
        name: new RegExp(`Answer ${index}:`),
      });
      expect(answer).toHaveProperty('tabIndex', 0);
      expect(answer).toHaveAttribute('type', 'button');
    }

    const firstAnswer = screen.getByRole('button', { name: 'Answer 1: 48' });
    await user.click(firstAnswer);
    expect(
      screen.getByRole('button', { name: /Answer 1: 48, selected/i }),
    ).toHaveAttribute('aria-keyshortcuts', '1');

    const flip = screen.getByRole('button', { name: 'Flip card' });
    expect(flip).toHaveProperty('tabIndex', 0);
    expect(flip).toHaveAttribute('type', 'button');
    await user.click(flip);
    expect(screen.getByRole('heading', { name: /equals 56/i })).toHaveFocus();
  });

  it('selects answers with number keys without intercepting form input', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label>
          Test input
          <input />
        </label>
        <QuestionCard
          question={question}
          currentQuestion={1}
          totalQuestions={5}
          onResult={vi.fn()}
        />
      </>,
    );

    await user.keyboard('3');
    expect(
      screen.getByRole('button', { name: /Answer 3: 56, selected/i }),
    ).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Test input' });
    await user.click(input);
    await user.keyboard('2');
    expect(input).toHaveValue('2');
    expect(
      screen.getByRole('button', { name: /Answer 3: 56, selected/i }),
    ).toBeInTheDocument();
  });

  it('announces question changes and the revealed answer', async () => {
    const user = userEvent.setup();
    render(
      <QuestionCard
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Question announcement')).toHaveTextContent(
      'Question 1 of 5. 7 multiplied by 8 equals what. Choose an answer.',
    );
    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: 'Flip card' }));
    expect(screen.getByLabelText('Answer announcement')).toHaveTextContent(
      'Correct answer: 56. Your answer: 48. Choose how you did.',
    );
  });

  it('disables motion for system preferences and the application setting', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const first = render(
      <QuestionCard
        animationsEnabled
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );
    expect(screen.getByRole('article')).toHaveAttribute('data-motion', 'reduced');

    first.unmount();
    vi.unstubAllGlobals();
    render(
      <QuestionCard
        animationsEnabled={false}
        question={question}
        currentQuestion={1}
        totalQuestions={5}
        onResult={vi.fn()}
      />,
    );
    expect(screen.getByRole('article')).toHaveClass('question-card--no-motion');
  });
});
