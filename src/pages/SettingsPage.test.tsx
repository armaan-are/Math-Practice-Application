import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSettings } from '../services/storageService';
import { SettingsPage } from './SettingsPage';

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear());

  it('saves all preference types and practice defaults', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('checkbox', { name: 'Sound effects' }));
    await user.click(screen.getByRole('checkbox', { name: 'Positive feedback' }));
    await user.click(screen.getByRole('radio', { name: /Advanced/ }));
    await user.click(screen.getByRole('radio', { name: '20 questions' }));
    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '4');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved');
    expect(loadSettings()).toMatchObject({
      soundEffects: false,
      positiveFeedback: false,
      defaultDifficulty: 4,
      defaultSessionLength: 20,
      masteryThreshold: 4,
    });
  });

  it('requires confirmation before clearing all data', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('button', { name: 'Clear all application data' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(loadSettings().masteryThreshold).toBe(3);
    vi.restoreAllMocks();
  });
});
