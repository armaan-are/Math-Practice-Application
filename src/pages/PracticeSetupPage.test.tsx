import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PracticeSetupPage } from './PracticeSetupPage';

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <Routes>
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<p>Practice session opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticeSetupPage', () => {
  it('uses sensible defaults and starts a session', async () => {
    const user = userEvent.setup();
    renderSetup();

    expect(screen.getByRole('button', { name: /addition selected/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('radio', { name: /beginner/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();

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
});
