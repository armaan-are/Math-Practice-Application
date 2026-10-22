import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAttempt } from '../services/storageService';
import { StatisticsPage } from './StatisticsPage';

describe('StatisticsPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows an empty state with zero stored attempts', () => {
    render(<StatisticsPage />);
    expect(screen.getByText('Your first stats are waiting')).toBeInTheDocument();
  });

  it('shows stored totals and resets only after confirmation', async () => {
    saveAttempt({
      id: 'a',
      questionId: 'q',
      operation: 'addition',
      firstOperand: 1,
      secondOperand: 2,
      correctAnswer: 3,
      selectedAnswer: 3,
      selfReportedCorrect: true,
      difficulty: 1,
      source: 'regular',
      attemptedAt: new Date().toISOString(),
      sessionId: 's',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StatisticsPage />);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Reset statistics' }));
    expect(screen.getByText('Your first stats are waiting')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
