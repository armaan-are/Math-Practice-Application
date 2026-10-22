import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadActiveSession,
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  saveMistakePatterns,
  saveSettings,
} from '../services/storageService';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { PracticePage } from './PracticePage';
import { PracticeSetupPage } from './PracticeSetupPage';

function renderPractice(state?: unknown, withLeaveLink = false) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state }]}>
      <Routes>
        <Route
          path="/practice/session"
          element={
            <>
              {withLeaveLink && <Link to="/statistics">Leave practice</Link>}
              <PracticePage />
            </>
          }
        />
        <Route path="/practice/setup" element={<p>Setup page</p>} />
        <Route path="/practice/summary" element={<p>Summary page</p>} />
        <Route path="/statistics" element={<p>Statistics page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function answerOnce(
  user: ReturnType<typeof userEvent.setup>,
  result: 'right' | 'wrong',
) {
  await user.click(screen.getAllByRole('button', { name: /^Answer \d:/ })[0]);
  await user.click(screen.getByRole('button', { name: 'Flip card' }));
  await user.click(screen.getByRole('button', { name: `I got it ${result}` }));
}

describe('PracticePage', () => {
  beforeEach(() => localStorage.clear());

  it('redirects when setup data is missing', () => {
    renderPractice();
    expect(screen.getByText('Setup page')).toBeInTheDocument();
  });

  it('starts from setup and immediately saves a recoverable session', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/practice/setup']}>
        <Routes>
          <Route path="/practice/setup" element={<PracticeSetupPage />} />
          <Route path="/practice/session" element={<PracticePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(loadActiveSession()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Start session' }));
    expect(screen.getByRole('article', { name: /Question 1 of 10/ })).toBeVisible();
    expect(loadActiveSession()).toMatchObject({
      session: { attempted: 0, isActive: true },
      selectedAnswer: null,
      isCardFlipped: false,
    });
  });

  it('restores the exact question, selection, and reveal state after refresh', async () => {
    const user = userEvent.setup();
    const first = renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });
    const questionText = screen.getByRole('heading', { level: 1 }).textContent;
    const selectedButton = screen.getAllByRole('button', { name: /^Answer \d:/ })[0];
    const selectedAnswer = Number(
      selectedButton.getAttribute('aria-label')?.match(/: (-?\d+)/)?.[1],
    );
    await user.click(selectedButton);
    await user.click(screen.getByRole('button', { name: 'Flip card' }));
    expect(loadActiveSession()).toMatchObject({
      selectedAnswer,
      isCardFlipped: true,
    });

    first.unmount();
    renderPractice();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      questionText?.replace('?', '') ?? '',
    );
    expect(screen.getByText('Your answer').nextElementSibling).toHaveTextContent(
      String(selectedAnswer),
    );
    expect(screen.getByRole('button', { name: 'I got it wrong' })).toBeEnabled();
  });

  it('cancels or confirms navigation without silently losing progress', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPractice(
      {
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
        reviewMode: 'regular',
      },
      true,
    );

    await user.click(screen.getByRole('link', { name: 'Leave practice' }));
    expect(screen.queryByText('Statistics page')).not.toBeInTheDocument();
    expect(loadActiveSession()).not.toBeNull();
    expect(loadSessions()).toEqual([]);

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('link', { name: 'Leave practice' }));
    expect(screen.getByText('Statistics page')).toBeInTheDocument();
    expect(loadActiveSession()).toBeNull();
    expect(loadSessions()[0]).toMatchObject({ attempted: 0, isActive: false });
    confirm.mockRestore();
  });

  it('warns during an active session and removes the warning after completion', async () => {
    const user = userEvent.setup();
    renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });

    const activeUnload = new Event('beforeunload', { cancelable: true });
    expect(window.dispatchEvent(activeUnload)).toBe(false);
    expect(activeUnload.defaultPrevented).toBe(true);

    for (let count = 0; count < 5; count += 1) {
      await answerOnce(user, 'right');
    }
    expect(screen.getByText('Summary page')).toBeInTheDocument();
    expect(loadActiveSession()).toBeNull();
    const completedUnload = new Event('beforeunload', { cancelable: true });
    expect(window.dispatchEvent(completedUnload)).toBe(true);
    expect(completedUnload.defaultPrevented).toBe(false);
  });

  it('tracks results, progress, and advances to a different question', async () => {
    const user = userEvent.setup();
    renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });
    const firstQuestion = screen.getByRole('heading', { level: 1 }).textContent;
    expect(screen.getByLabelText('Session progress announcement')).toHaveTextContent(
      'Question 1 of 5. 0 right and 0 to review.',
    );
    await answerOnce(user, 'right');
    expect(screen.getByText('1 right')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getAllByText(/Question 2 of 5/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Session progress announcement')).toHaveTextContent(
      'Question 2 of 5. 1 right and 0 to review.',
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe(firstQuestion);
    expect(screen.getByLabelText('Practice feedback')).toHaveTextContent(
      /Nice work|Great job|You got it/,
    );
  });

  it('uses supportive language after a mistake and respects disabled feedback', async () => {
    const user = userEvent.setup();
    const first = renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });
    await answerOnce(user, 'wrong');
    expect(screen.getByLabelText('Practice feedback')).toHaveTextContent(
      /Good effort|Mistakes help your brain grow|Keep going/,
    );

    first.unmount();
    localStorage.clear();
    saveSettings({ ...DEFAULT_SETTINGS, positiveFeedback: false });
    renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });
    await answerOnce(user, 'right');
    expect(screen.queryByLabelText('Practice feedback')).not.toBeInTheDocument();
  });

  it('supports confirmed ending of continuous practice', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPractice({
      operations: ['division'],
      difficulty: 2,
      sessionLength: 'continuous',
      reviewMode: 'regular',
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'End session' }));
    expect(screen.getByText('Summary page')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('persists a mistake pattern after a self-reported wrong answer', async () => {
    const user = userEvent.setup();
    const view = renderPractice({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'regular',
    });
    await answerOnce(user, 'wrong');
    expect(loadMistakePatterns()).toHaveLength(1);
    expect(loadMistakePatterns()[0]).toMatchObject({
      operation: 'addition',
      incorrectCount: 1,
      similarCorrectCount: 0,
      mastered: false,
    });

    view.unmount();
    render(
      <MemoryRouter initialEntries={['/practice/setup?mode=mistakes']}>
        <PracticeSetupPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('radio', { name: 'Practice mistakes' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'Practice mistakes' })).toBeChecked();
    expect(
      screen.getByText('1 active mistake pattern is ready for these choices.'),
    ).toBeInTheDocument();
  });

  it('practices a mistake until the configured mastery threshold is reached', async () => {
    saveMistakePatterns([
      {
        id: 'mistake-1',
        operation: 'multiplication',
        firstOperand: 4,
        secondOperand: 5,
        correctAnswer: 20,
        difficulty: 1,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: '2026-10-21T20:00:00.000Z',
        mastered: false,
      },
    ]);
    const user = userEvent.setup();
    renderPractice({
      operations: ['multiplication'],
      difficulty: 1,
      sessionLength: 5,
      reviewMode: 'mistake-review',
    });

    await answerOnce(user, 'right');
    await answerOnce(user, 'right');
    await answerOnce(user, 'right');

    expect(screen.getByText('Summary page')).toBeInTheDocument();
    expect(loadMistakePatterns()[0]).toMatchObject({
      similarCorrectCount: 3,
      similarAttemptCount: 3,
      mastered: true,
    });
    expect(loadSessions()[0]).toMatchObject({
      reviewMode: 'mistake-review',
      attempted: 3,
      mistakeReviewCount: 3,
      isActive: false,
    });
    expect(loadAttempts()).toHaveLength(3);
    expect(
      loadAttempts().every((attempt) => attempt.mistakePatternId === 'mistake-1'),
    ).toBe(true);
  });
});
