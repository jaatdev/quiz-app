'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type SubMeta = {
  id: string;
  name: string;
  topic?: { name?: string; subject?: { name?: string } };
};

export function SelectedFilters({ subMeta }: { subMeta: SubMeta[] }) {
  const [open, setOpen] = useState(false);
  const count = subMeta?.length || 0;

  if (!count) return null;

  return (
    <div className="mt-2">
      {/* Desktop: show inline chips */}
      <div className="hidden md:flex flex-wrap gap-2">
        {subMeta.map((st) => (
          <span key={st.id} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {(st.topic?.subject?.name ? `${st.topic.subject.name} • ` : '') +
             (st.topic?.name ? `${st.topic.name} • ` : '') +
             st.name}
          </span>
        ))}
      </div>

      {/* Mobile: Filters pill button */}
      <div className="md:hidden">
        <button
          className="rounded-full border px-3 py-1 text-xs font-medium text-blue-700 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
          onClick={() => setOpen(true)}
        >
          Filters ({count})
        </button>

        {/* Simple mobile overlay */}
        {open && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-gray-900 p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Selected Filters</div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[50vh] overflow-auto">
                <div className="flex flex-wrap gap-2">
                  {subMeta.map((st) => (
                    <span key={st.id} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {(st.topic?.subject?.name ? `${st.topic.subject.name} • ` : '') +
                        (st.topic?.name ? `${st.topic.name} • ` : '') +
                        st.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100" onClick={() => setOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
