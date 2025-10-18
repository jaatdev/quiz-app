import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as rtl from '@testing-library/react';
import { vi } from 'vitest';

// mock alias-based UI modules and others so the page can be imported in tests
// Use jest.mock so TypeScript picks up existing `jest` types from tsconfig
vi.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardTitle: (props: any) => <div {...props} />,
  CardDescription: (props: any) => <div {...props} />,
}));
// Mock a subjects list UI helper (if ImportPage maps subjects without keys in test env)
vi.mock('@/components/admin/subject-item', () => ({
  SubjectItem: ({ subject }: any) => <div data-testid={`subject-${subject?.id || 's'}`}>{subject?.name || 'sub'}</div>
}));
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));
vi.mock('@/lib/config', () => ({ API_URL: 'http://localhost' }));
vi.mock('@/providers/toast-provider', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: { id: 'test-user' } }) }));
vi.mock('lucide-react', () => ({
  Upload: (p: any) => <svg {...p} />, FileJson: (p: any) => <svg {...p} />, FileText: (p: any) => <svg {...p} />,
  Download: (p: any) => <svg {...p} />, AlertCircle: (p: any) => <svg {...p} />, CheckCircle: (p: any) => <svg {...p} />,
  Info: (p: any) => <svg {...p} />, Lock: (p: any) => <svg {...p} />,
}));

import ImportPage from '../../../../app/admin/import/page';

describe('Why EN+HI modal', () => {
  beforeEach(() => {
    // provide a lightweight localStorage mock for the test environment
    const store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    } as unknown as Storage;
  // mock fetch used in the component to fetch subjects
  (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  });
  afterEach(() => {
    // cleanup
    try { delete (global as any).localStorage; } catch {}
  });

  it('opens modal when clicking Why EN+HI and persists hide flag', async () => {
    render(<ImportPage /> as any);

    const user = userEvent.setup();

    const whyBtn = await screen.findByText(/Why EN\+HI\?/i);
    await user.click(whyBtn);

    const heading = await screen.findByText(/Why only English and Hindi\?/i);
    expect(heading).toBeTruthy();

    // find the Don't show again checkbox (accept straight or curly apostrophe)
    const checkbox = screen.getByLabelText(/Don(?:'|’|`)?t show again/i) || screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(localStorage.getItem('hideWhyEnHi')).toBe('1');

    const gotIt = screen.getByText(/Got it/i);
    await user.click(gotIt);

    // heading should not be visible after close
    expect(screen.queryByText(/Why only English and Hindi\?/i)).toBeNull();
  });
});
