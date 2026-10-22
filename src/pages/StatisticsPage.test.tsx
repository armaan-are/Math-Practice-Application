import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadMistakePatterns,
  saveAttempt,
  saveMistakePatterns,
} from '../services/storageService';
import { StatisticsPage } from './StatisticsPage';

describe('StatisticsPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows an empty state with zero stored attempts', () => {
    render(<StatisticsPage />);
    expect(screen.getByText('Your first stats are waiting')).toBeInTheDocument();
    expect(screen.getByText(/No mistake patterns yet/i)).toBeInTheDocument();
    expect(screen.getByText('No similar-question history yet.')).toBeInTheDocument();
  });

  it('shows review totals, tied missed areas, pattern groups, and related history', () => {
    saveMistakePatterns([
      {
        id: 'active-addition',
        operation: 'addition',
        firstOperand: 7,
        secondOperand: 8,
        correctAnswer: 15,
        difficulty: 2,
        incorrectCount: 3,
        similarCorrectCount: 1,
        similarAttemptCount: 2,
        lastIncorrectAt: '2026-10-21T20:00:00Z',
        mastered: false,
      },
      {
        id: 'mastered-multiplication',
        operation: 'multiplication',
        firstOperand: 6,
        secondOperand: 7,
        correctAnswer: 42,
        difficulty: 2,
        incorrectCount: 3,
        similarCorrectCount: 3,
        similarAttemptCount: 3,
        lastIncorrectAt: '2026-10-20T20:00:00Z',
        mastered: true,
      },
    ]);
    saveAttempt({
      id: 'review-correct',
      questionId: 'q1',
      operation: 'addition',
      firstOperand: 8,
      secondOperand: 8,
      correctAnswer: 16,
      selectedAnswer: 16,
      selfReportedCorrect: true,
      difficulty: 2,
      source: 'mistake-review',
      mistakePatternId: 'active-addition',
      attemptedAt: '2026-10-21T21:00:00Z',
      sessionId: 's1',
    });
    saveAttempt({
      id: 'review-wrong',
      questionId: 'q2',
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 7,
      correctAnswer: 49,
      selectedAnswer: 42,
      selfReportedCorrect: false,
      difficulty: 2,
      source: 'mistake-review',
      mistakePatternId: 'mastered-multiplication',
      attemptedAt: '2026-10-21T22:00:00Z',
      sessionId: 's1',
    });

    render(<StatisticsPage />);

    const overview = screen.getByLabelText('Mistake-review statistics');
    expect(
      within(overview).getByText('Active patterns').nextElementSibling,
    ).toHaveTextContent('1');
    expect(
      within(overview).getByText('Mastered patterns').nextElementSibling,
    ).toHaveTextContent('1');
    expect(
      within(overview).getByText('Similar practiced').nextElementSibling,
    ).toHaveTextContent('2');
    expect(
      within(overview).getByText('Review answers right').nextElementSibling,
    ).toHaveTextContent('1');
    expect(screen.getByText(/Addition and Multiplication/)).toBeInTheDocument();
    expect(screen.getAllByText('7 + 8 = 15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('6 × 7 = 42').length).toBeGreaterThan(0);
    expect(
      within(screen.getByRole('region', { name: 'Active patterns' })).getByText(
        /1 of 3 review answers right/,
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Mastered patterns' })).getByText(
        /3 of 3 review answers right/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('8 + 8 = 16')).toBeInTheDocument();
    expect(screen.getByText('7 × 7 = 49')).toBeInTheDocument();
    expect(screen.getByText('Keep practicing')).toBeInTheDocument();
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
    saveMistakePatterns([
      {
        id: 'mistake',
        operation: 'addition',
        firstOperand: 1,
        secondOperand: 2,
        correctAnswer: 3,
        difficulty: 1,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: new Date().toISOString(),
        mastered: false,
      },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<StatisticsPage />);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Reset statistics' }));
    expect(screen.getByText('Your first stats are waiting')).toBeInTheDocument();
    expect(screen.getByText(/No mistake patterns yet/i)).toBeInTheDocument();
    expect(loadMistakePatterns()).toEqual([]);
    vi.restoreAllMocks();
  });
});
