'use client';
import React, { useEffect, useState } from 'react';

type AuditLog = {
  id: string;
  event: string;
  actorId?: string | null;
  actorEmail?: string | null;
  quizId?: string | null;
  originalQuizId?: string | null;
  languagesFound?: string[];
  languagesPruned?: string[];
  forcedMultilingual?: boolean;
  meta?: any;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&pageSize=20`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Audit Logs</h1>
  {loading && <div>Loading…</div>}
  {error && <div className="text-sm text-red-600">{error}</div>}
  {!loading && !error && items.length === 0 && <div className="text-sm text-muted-foreground">No audit logs found</div>}
      <div className="space-y-2 mt-4">
        {items.map((it) => (
          <div key={it.id} className="border rounded p-3">
            <div className="text-sm text-zinc-700">{new Date(it.createdAt).toLocaleString()}</div>
            <div className="font-medium">{it.event}</div>
            <div className="text-xs text-zinc-600">Actor: {it.actorEmail || it.actorId || 'system'}</div>
            <div className="mt-2 text-sm">
              {it.languagesFound && it.languagesFound.length > 0 && (
                <div>Found: {it.languagesFound.join(', ')}</div>
              )}
              {it.languagesPruned && it.languagesPruned.length > 0 && (
                <div>Pruned: {it.languagesPruned.join(', ')}</div>
              )}
              {it.meta && (
                <pre className="text-xs bg-zinc-50 p-2 rounded mt-2">{JSON.stringify(it.meta, null, 2)}</pre>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-6">
  <button className="btn" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <div className="text-sm">Page {page} / {totalPages}</div>
  <button className="btn" disabled={loading || page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </div>
  );
}
