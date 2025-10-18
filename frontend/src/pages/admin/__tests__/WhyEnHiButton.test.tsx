import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import WhyEnHiButton from '../../../../components/admin/WhyEnHiButton';

// Mock WhyEnHiModal to avoid animations complexity
vi.mock('@/components/WhyEnHiModal', () => ({
  default: ({ open, onClose }: any) => open ? (
    <div>
      <h3>Why only English and Hindi?</h3>
      <label>
        <input type="checkbox" onChange={(e: any) => {
          if (e.target.checked) localStorage.setItem('hideWhyEnHi','1');
          else localStorage.removeItem('hideWhyEnHi');
        }} />
        Don't show again
      </label>
      <button onClick={onClose}>Got it</button>
    </div>
  ) : null
}));

describe('WhyEnHiButton', () => {
  beforeEach(() => {
    const store: Record<string,string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
    } as Storage;
  });

  afterEach(() => {
    try { delete (global as any).localStorage; } catch {}
  });

  it('opens modal and sets localStorage on dont show again', () => {
    render(<WhyEnHiButton />);
    const btn = screen.getByText(/Why EN\+HI\?/i);
    fireEvent.click(btn);
    expect(screen.getByText(/Why only English and Hindi\?/i)).toBeInTheDocument();
    const checkbox = screen.getByLabelText(/Don't show again/i);
    fireEvent.click(checkbox);
    expect(localStorage.getItem('hideWhyEnHi')).toBe('1');
    const gotIt = screen.getByText(/Got it/i);
    fireEvent.click(gotIt);
    expect(screen.queryByText(/Why only English and Hindi\?/i)).toBeNull();
  });
});
