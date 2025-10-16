'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type SubTopic = { id: string; name: string };
type Topic = { id: string; name: string; subTopics: SubTopic[] };
type SubjectData = { id: string; name: string; topics: Topic[] };

export function CustomQuizDrawer({
  subject,
  open,
  onClose,
  onStart
}: {
  subject: SubjectData;
  open: boolean;
  onClose: () => void;
  onStart: (subTopicIds: string[], count: number) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<number>(10);

  const allSubTopicIds = useMemo(
    () => subject.topics.flatMap((t) => t.subTopics.map((st) => st.id)),
    [subject]
  );

  const selectAllAcrossSubject = () => {
    const s = new Set(selected);
    const every = allSubTopicIds.every((id) => s.has(id));
    if (every) allSubTopicIds.forEach((id) => s.delete(id));
    else allSubTopicIds.forEach((id) => s.add(id));
    setSelected(s);
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const toggleTopicAll = (topic: Topic) => {
    const ids = topic.subTopics.map((st) => st.id);
    const s = new Set(selected);
    const every = ids.every((id) => s.has(id));
    if (every) ids.forEach((id) => s.delete(id));
    else ids.forEach((id) => s.add(id));
    setSelected(s);
  };

  const toggleSubTopic = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const toggleExpanded = (id: string) => {
    const e = new Set(expanded);
    if (e.has(id)) e.delete(id);
    else e.add(id);
    setExpanded(e);
  };

  if (!open) return null;

  const selectedCount = selected.size;
  const subjectAllSelected = selectedCount > 0 && allSubTopicIds.every((id) => selected.has(id));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-gray-900 p-4 shadow-xl md:max-w-3xl md:mx-auto">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-700 dark:text-gray-300">Build Custom Quiz</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{subject.name}</div>
          </div>
          <button onClick={onClose} className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Global toggles */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={selectAllAcrossSubject}>
            {subjectAllSelected ? <Square className="h-4 w-4 mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
            {subjectAllSelected ? 'Unselect All Across Subject' : 'Select All Across Subject'}
          </Button>
          <Button variant="outline" onClick={clearAll}>Select None</Button>

          <div className="ml-auto inline-flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Questions:</span>
            <div className="inline-flex rounded-lg border bg-white/70 dark:bg-gray-900/70 p-1">
              {[10, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md',
                    count === n ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topics & sub-topics */}
        <div className="max-h-[55vh] overflow-auto rounded-lg border p-3">
          {subject.topics.map((t) => {
            const tIds = t.subTopics.map((st) => st.id);
            const topicAllSelected = tIds.length > 0 && tIds.every((id) => selected.has(id));
            const isOpen = expanded.has(t.id);
            return (
              <div key={t.id} className="mb-3 rounded-lg border p-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleTopicAll(t)}>
                      {topicAllSelected ? 'Unselect All' : 'Select All'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleExpanded(t.id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.subTopics.map((st) => {
                      const active = selected.has(st.id);
                      return (
                        <button
                          key={st.id}
                          onClick={() => toggleSubTopic(st.id)}
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            active
                              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          )}
                        >
                          {st.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-700 dark:text-gray-300">{selectedCount} sub-topic{selectedCount === 1 ? '' : 's'} selected</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={selectedCount === 0}
              onClick={() => onStart(Array.from(selected), count)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
