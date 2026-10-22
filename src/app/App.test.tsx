import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the application title and welcome message', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Math Quest' })).toBeInTheDocument();
    expect(screen.getByText(/grow your math skills/i)).toBeInTheDocument();
  });
});
