"use client";

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRightLeft } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

const langBadge = (langs: string[] = []) => (
  <div className="flex gap-2">
    {langs.includes('en') && <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>}
    {langs.includes('hi') && <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">HI</span>}
  </div>
);

export default function BulkConvertPage() {
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [action, setAction] = useState<'multi' | 'single_en' | 'single_hi'>('multi');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, 'idle'|'converting'|'done'|'error'>>({});
  const [realtime, setRealtime] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const fetchQuizzes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/quizzes`, {
        headers: { 'x-clerk-user-id': user.id },
      });
      const data = await res.json().catch(() => null);
      if (res.ok) setQuizzes(data.quizzes || []);
      else throw new Error(data?.error || 'Failed');
    } catch (e) {
      console.error('Failed to fetch quizzes', e);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const allSelectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);

  const toggleAll = (checked: boolean) => {
    const map: Record<string, boolean> = {};
    quizzes.forEach((q) => { map[q.quizId] = checked; });
    setSelected(map);
  };

  const simulateAfter = (q: any) => {
    if (action === 'multi') return { langs: ['en','hi'], isMulti: true };
    if (action === 'single_en') return { langs: ['en'], isMulti: false };
    return { langs: ['hi'], isMulti: false };
  };

  const sampleFromQuiz = (q: any) => {
    const title = typeof q.title === 'string' ? q.title : (q.title?.en || q.title?.hi || 'Untitled');
    const first = q.questions?.[0];
    if (!first) return { title, current: {}, after: {} };

    const qEn = (first.question && (first.question.en || first.question)) || '';
    const qHi = first.question?.hi || '';
    const optsEn = Array.isArray(first.options) ? first.options.map((o:any)=> o.text) : (first.options?.en || []);
    const optsHi = Array.isArray(first.options) ? first.options.map((o:any)=> o.text) : (first.options?.hi || []);

    return { title, current: { qEn, qHi, optsEn, optsHi } };
  };

  const simulateAfterSample = (q: any) => {
    if (action === 'multi') {
      const first = q.questions?.[0] || {};
      return {
        qEn: first.question?.en || first.question?.hi || '',
        qHi: first.question?.hi || first.question?.en || '',
        optsEn: first.options?.en?.length ? first.options.en : (first.options?.hi || []),
        optsHi: first.options?.hi?.length ? first.options.hi : (first.options?.en || []),
      };
    }
    if (action === 'single_en') {
      const first = q.questions?.[0] || {};
      return { qEn: first.question?.en || first.question?.hi || '', qHi: '', optsEn: first.options?.en || first.options?.hi || [], optsHi: [] };
    }
    const first = q.questions?.[0] || {};
    return { qEn: '', qHi: first.question?.hi || first.question?.en || '', optsEn: [], optsHi: first.options?.hi || first.options?.en || [] };
  };

  const convertOne = async (quizId: string) => {
    setProgress(p => ({ ...p, [quizId]: 'converting' }));
    try {
      const token = user?.id || '';
      const payload: any = { to: action === 'multi' ? 'multi' : 'single' };
      if (action === 'single_en') payload.lang = 'en';
      if (action === 'single_hi') payload.lang = 'hi';

      const res = await fetch(`${API_URL}/quizzes/multilingual/${quizId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': token },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('convert failed');
      setProgress(p => ({ ...p, [quizId]: 'done' }));
    } catch (e) {
      console.error(e);
      setProgress(p => ({ ...p, [quizId]: 'error' }));
    }
  };

  const doConvert = async () => {
    if (!user || allSelectedIds.length === 0) return;
    setBusy(true); setResults([]);
    try {
      const payload = {
        quizIds: allSelectedIds,
        to: action === 'multi' ? 'multi' : 'single',
        lang: action === 'single_en' ? 'en' : action === 'single_hi' ? 'hi' : undefined,
      } as any;

      const res = await fetch(`${API_URL}/admin/quizzes/convert-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user.id },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'Convert failed');
      setResults(data.results || []);
      await fetchQuizzes();
      setSelected({});
    } catch (e) {
      console.error(e);
      alert('Bulk convert failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading quizzes…</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bulk Convert Quizzes</h1>
          <div className="flex gap-3">
            <select value={action} onChange={(e) => setAction(e.target.value as any)} className="px-3 py-2 rounded-lg border">
              <option value="multi">→ Multilingual (EN+HI)</option>
              <option value="single_en">→ Single English (EN)</option>
              <option value="single_hi">→ Single Hindi (HI)</option>
            </select>
            <Button onClick={doConvert} disabled={busy || allSelectedIds.length === 0}>
              <ArrowRightLeft className="mr-2" /> Convert Selected ({allSelectedIds.length})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="p-3"><input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} checked={quizzes.length>0 && allSelectedIds.length===quizzes.length} /></th>
                <th className="p-3">Title</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Current</th>
                <th className="p-3">After</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Questions</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => {
                const sel = !!selected[q.quizId];
                const after = simulateAfter(q);
                const title = typeof q.title === 'string' ? q.title : (q.title?.en || q.title?.hi || 'Untitled');
                return (
                  <tr key={q.quizId} className="border-t">
                    <td className="p-3"><input type="checkbox" checked={sel} onChange={(e) => setSelected(s => ({ ...s, [q.quizId]: e.target.checked }))} /></td>
                    <td className="p-3">{title}</td>
                    <td className="p-3">
                      <button
                        className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                        onClick={() => setExpanded(e => ({ ...e, [q.quizId]: !e[q.quizId] }))}
                      >
                        {expanded[q.quizId] ? 'Hide' : 'Show'}
                      </button>
                    </td>
                    <td className="p-3"><div className="flex items-center gap-2">{langBadge(q.availableLanguages || [])}{q.isMultilingual && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Multi</span>}</div></td>
                    <td className="p-3"><div className="flex items-center gap-2">{langBadge(after.langs)}{after.isMulti && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Multi</span>}</div></td>
                    <td className="p-3">
                      <span className={
                        progress[q.quizId] === 'converting' ? 'text-blue-600' :
                        progress[q.quizId] === 'done' ? 'text-green-600' :
                        progress[q.quizId] === 'error' ? 'text-red-600' : 'text-gray-400'
                      }>
                        {progress[q.quizId] || 'idle'}
                      </span>
                    </td>
                    <td className="p-3">{q.questions?.length || 0}</td>
                    <td className="p-3 capitalize">{q.difficulty || '-'}</td>
                    <td className="p-3">{q.category || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded previews */}
        <div>
          {quizzes.map((q) => expanded[q.quizId] && (
            <div key={`preview-${q.quizId}`} className="bg-gray-50/50 dark:bg-gray-700/30 p-4 my-2 rounded">
              {(() => {
                const sample = sampleFromQuiz(q);
                const after = simulateAfterSample(q);
                return (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold mb-2">Current (Q1)</div>
                      <div className="mb-2">
                        <div className="text-gray-500">EN</div>
                        <div className="text-gray-900 dark:text-gray-100">{sample.current.qEn || '—'}</div>
                        {sample.current.optsEn?.length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                            {sample.current.optsEn.slice(0,4).map((o:any,i:number)=> <li key={`${q.quizId}-current-en-${i}`}>{o}</li>)}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-500">HI</div>
                        <div className="text-gray-900 dark:text-gray-100">{sample.current.qHi || '—'}</div>
                        {sample.current.optsHi?.length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                            {sample.current.optsHi.slice(0,4).map((o:any,i:number)=> <li key={`${q.quizId}-current-hi-${i}`}>{o}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">After Convert (Q1)</div>
                      <div className="mb-2">
                        <div className="text-gray-500">EN</div>
                        <div className="text-gray-900 dark:text-gray-100">{after.qEn || '—'}</div>
                        {after.optsEn?.length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                            {after.optsEn.slice(0,4).map((o:any,i:number)=> <li key={`${q.quizId}-after-en-${i}`}>{o}</li>)}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-500">HI</div>
                        <div className="text-gray-900 dark:text-gray-100">{after.qHi || '—'}</div>
                        {after.optsHi?.length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                            {after.optsHi.slice(0,4).map((o:any,i:number)=> <li key={`${q.quizId}-after-hi-${i}`}>{o}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={() => convertOne(q.quizId)} disabled={progress[q.quizId] === 'converting'}>Convert One</Button>
              </div>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2"><CheckCircle /> <span className="font-semibold">Bulk conversion complete</span></div>
            <ul className="text-sm text-green-700 grid md:grid-cols-2 gap-y-1">
              {results.map((r: any, i: number) => <li key={`${r.quizId}-${i}`}>• {r.quizId}: {r.ok ? 'OK' : `Failed (${r.error})`}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
