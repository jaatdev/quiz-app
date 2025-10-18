import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }))

import AuditLogsPage from '../../../../app/admin/audit-logs/page'

describe('AuditLogs page', () => {
  beforeEach(() => {
    const sample = {
      items: [
        { id: 'a1', event: 'QUIZ_LANG_PRUNE', actorEmail: 'admin@example.com', languagesFound: ['en','hi','es'], languagesPruned: ['es'], createdAt: new Date().toISOString(), meta: { questionCount: 10 } },
        { id: 'a2', event: 'QUIZ_CONVERT', actorEmail: 'admin2@example.com', languagesFound: ['en','hi'], languagesPruned: [], createdAt: new Date().toISOString(), meta: { questionCount: 5 } },
      ],
      totalPages: 1,
      page: 1,
      pageSize: 20,
      total: 2,
    }
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve(sample) }))
  })

  it('fetches and renders audit logs', async () => {
    render(<AuditLogsPage /> as any)

    // Loading first
    expect(screen.getByText(/Loading/i)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeNull())

    expect(screen.getByText(/Audit Logs/i)).toBeTruthy()
    expect(screen.getByText(/QUIZ_LANG_PRUNE/i)).toBeTruthy()
    expect(screen.getByText(/admin@example.com/i)).toBeTruthy()
  })
})
