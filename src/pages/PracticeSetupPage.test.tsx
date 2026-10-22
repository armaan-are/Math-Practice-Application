import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveMistakePatterns } from '../services/storageService';
import { PracticeSetupPage } from './PracticeSetupPage';

function renderSetup(path = '/practice/setup') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<p>Practice session opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticeSetupPage', () => {
  beforeEach(() => localStorage.clear());

  it('uses sensible defaults and starts a session', async () => {
    const user = userEvent.setup();
    renderSetup();

    expect(screen.getByRole('button', { name: /addition selected/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('radio', { name: /beginner/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Regular practice' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Start session' }));
    expect(screen.getByText('Practice session opened')).toBeInTheDocument();
  });

  it('supports multiple operations and disables start when none are selected', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('button', { name: 'Subtraction not selected' }));
    expect(screen.getByRole('button', { name: /addition selected/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /subtraction selected/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Select all operations' }));
    await user.click(screen.getByRole('button', { name: 'Clear all operations' }));
    expect(screen.getByRole('button', { name: 'Start session' })).toBeDisabled();
  });

  it('disables mistake review when no matching active patterns exist', () => {
    renderSetup();
    expect(screen.getByRole('radio', { name: 'Practice mistakes' })).toBeDisabled();
    expect(
      screen.getByText(/becomes available after you mark an answer wrong/i),
    ).toBeInTheDocument();
  });

  it('shows the active count and honors the practice-mistakes link', () => {
    saveMistakePatterns([
      {
        id: 'mistake-1',
        operation: 'addition',
        firstOperand: 3,
        secondOperand: 4,
        correctAnswer: 7,
        difficulty: 1,
        incorrectCount: 1,
        similarCorrectCount: 0,
        similarAttemptCount: 0,
        lastIncorrectAt: '2026-10-21T20:00:00.000Z',
        mastered: false,
      },
    ]);
    renderSetup('/practice/setup?mode=mistakes');
    expect(screen.getByRole('radio', { name: 'Practice mistakes' })).toBeChecked();
    expect(
      screen.getByText('1 active mistake pattern is ready for these choices.'),
    ).toBeInTheDocument();
  });
});
