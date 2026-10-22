import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMistakePatterns } from '../services/storageService';
import { PracticePage } from './PracticePage';

function renderPractice(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state }]}>
      <Routes>
        <Route path="/practice/session" element={<PracticePage />} />
        <Route path="/practice/setup" element={<p>Setup page</p>} />
        <Route path="/practice/summary" element={<p>Summary page</p>} />
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

  it('tracks results, progress, and advances to a different question', async () => {
    const user = userEvent.setup();
    renderPractice({ operations: ['addition'], difficulty: 1, sessionLength: 5 });
    const firstQuestion = screen.getByRole('heading', { level: 1 }).textContent;
    await answerOnce(user, 'right');
    expect(screen.getByText('1 right')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByText(/Question 2 of 5/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe(firstQuestion);
  });

  it('supports confirmed ending of continuous practice', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPractice({
      operations: ['division'],
      difficulty: 2,
      sessionLength: 'continuous',
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'End session' }));
    expect(screen.getByText('Summary page')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('persists a mistake pattern after a self-reported wrong answer', async () => {
    const user = userEvent.setup();
    renderPractice({ operations: ['division'], difficulty: 2, sessionLength: 5 });
    await answerOnce(user, 'wrong');
    expect(loadMistakePatterns()).toHaveLength(1);
    expect(loadMistakePatterns()[0]).toMatchObject({
      operation: 'division',
      incorrectCount: 1,
      similarCorrectCount: 0,
      mastered: false,
    });
  });
});
