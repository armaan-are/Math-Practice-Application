import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'));

  it('renders the home page and its primary navigation actions', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Build big math confidence.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start practicing' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
    expect(screen.getByRole('link', { name: 'View statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    );
    expect(
      screen
        .getAllByRole('link', { name: 'Settings' })
        .every((link) => link.getAttribute('href') === '/settings'),
    ).toBe(true);
  });

  it('shows a friendly recovery page for an invalid route', () => {
    window.history.replaceState({}, '', '/not-a-real-page');
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'That page wandered off' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/stack|trace|error:/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start practicing' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
