'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type TopicItem = {
  id: string;
  name: string;
  subjectName: string;
  questions: number;
};

export function FeaturedTopicsCarousel({ subjects, onOpenTopic }:{
  subjects: any[];
  onOpenTopic: (topicId: string, topicName: string, subjectName: string) => void;
}) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [plugin.current]);

  // pick top topics by question count
  const items: TopicItem[] = useMemo(() => {
    const all: TopicItem[] = [];
    (subjects || []).forEach((s: any) => {
      (s.topics || []).forEach((t: any) => {
        all.push({
          id: t.id,
          name: t.name,
          subjectName: s.name,
          questions: t._count?.questions || 0
        });
      });
    });
    // Sort by questions desc, take 12 max
    return all.sort((a, b) => b.questions - a.questions).slice(0, 12);
  }, [subjects]);

  if (!items.length) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border bg-white/70 backdrop-blur dark:bg-gray-900/70" ref={emblaRef}>
        <div className="flex">
          {items.map((t) => (
            <div key={t.id} className="min-w-[260px] sm:min-w-[320px] p-4">
              <div
                className={cn(
                  'h-full rounded-lg border bg-gray-50 p-4 transition-all hover:shadow-lg dark:bg-gray-800/60'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{t.subjectName}</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                    <Target className="h-4 w-4" />
                    {t.questions}
                  </div>
                </div>
                <div className="mt-3">
                  <Button size="sm" onClick={() => onOpenTopic(t.id, t.name, t.subjectName)}>
                    Start
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
