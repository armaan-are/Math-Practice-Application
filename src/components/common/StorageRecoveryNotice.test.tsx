import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEYS,
  clearStorageRecoveryNotices,
  validateStoredData,
} from '../../services/storageService';
import { StorageRecoveryNotice } from './StorageRecoveryNotice';

describe('StorageRecoveryNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStorageRecoveryNotices();
  });

  it('explains a category-specific repair without technical details', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '{bad json');
    validateStoredData();
    render(<StorageRecoveryNotice />);

    expect(screen.getByLabelText('Saved data recovery')).toHaveTextContent(
      'reset only that part',
    );
    expect(screen.getByLabelText('Saved data recovery')).toHaveTextContent(
      'other Math Quest data is still here',
    );
    expect(screen.queryByText(/JSON|SyntaxError|stack/i)).not.toBeInTheDocument();
  });

  it('explains unavailable browser storage without crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => validateStoredData()).not.toThrow();
    render(<StorageRecoveryNotice />);
    expect(screen.getByLabelText('Saved data recovery')).toHaveTextContent(
      'not allowing saved progress',
    );
    vi.restoreAllMocks();
  });
});
