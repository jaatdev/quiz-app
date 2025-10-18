import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportPage from '../../../../app/admin/import/page';

test('renders Import page with multilingual control', async () => {
  render(<ImportPage /> as any);
  expect(screen.getByText(/Import as Multilingual \(EN\+HI\)/i)).toBeInTheDocument();
});

test('opens Why EN+HI modal and persists Dont show again', async () => {
  render(<ImportPage /> as any);

  // find the "Why EN+HI?" button
  const whyBtn = await screen.findByText(/Why EN\+HI\?/i);
  expect(whyBtn).toBeInTheDocument();

  await userEvent.click(whyBtn);

  // modal content should appear
  expect(await screen.findByText(/Why only English and Hindi\?/i)).toBeInTheDocument();

  // find the don't show again checkbox inside modal
  const dontShow = screen.getByLabelText(/Don('|’)t show again/i);
  await userEvent.click(dontShow);

  // close modal
  const gotIt = screen.getByText(/Got it/i);
  await userEvent.click(gotIt);

  // localStorage should have been set
  expect(localStorage.getItem('hideWhyEnHi')).toBe('1');
});
