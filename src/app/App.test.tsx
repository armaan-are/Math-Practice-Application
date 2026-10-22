import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
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
});
