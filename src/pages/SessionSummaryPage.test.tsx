import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '../types';
import { SessionSummaryPage } from './SessionSummaryPage';

const session: PracticeSession = {
  id: 'session-1',
  startedAt: '2026-10-21T20:00:00.000Z',
  completedAt: '2026-10-21T20:05:00.000Z',
  operations: ['addition', 'multiplication'],
  difficulty: 2,
  sessionLength: 5,
  reviewMode: 'regular',
  attempted: 5,
  correct: 4,
  incorrect: 1,
  mistakeReviewCount: 0,
  isActive: false,
};

function renderSummary(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/summary', state }]}>
      <Routes>
        <Route path="/practice/summary" element={<SessionSummaryPage />} />
        <Route path="/practice/setup" element={<p>Setup page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionSummaryPage', () => {
  it('shows accurate totals, accuracy, configuration, and every action', () => {
    renderSummary({ session, attempts: [] });
    expect(screen.getByLabelText('80% accuracy')).toBeInTheDocument();
    expect(screen.getByText('Addition, Multiplication')).toBeInTheDocument();
    expect(screen.getByText(/Easy/)).toBeInTheDocument();
    expect(screen.getByText('Mistake review').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByRole('link', { name: 'Practice again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Practice mistakes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View statistics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toBeInTheDocument();
  });

  it('handles a zero-attempt continuous session without dividing by zero', () => {
    renderSummary({
      session: { ...session, sessionLength: 'continuous', attempted: 0, correct: 0 },
      attempts: [],
    });
    expect(screen.getByLabelText('0% accuracy')).toBeInTheDocument();
  });

  it('shows friendly recovery when completed session data is unavailable', () => {
    renderSummary();
    expect(
      screen.getByRole('heading', {
        name: 'We could not find that session summary',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/saved statistics are still safe/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a new session' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });
});
