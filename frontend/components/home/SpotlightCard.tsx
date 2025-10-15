'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  return (
    <div
      onMouseMove={(event) => {
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setPos({ x, y });
      }}
      className={cn(
        'relative rounded-xl border bg-white/70 p-4 shadow-sm backdrop-blur transition-all dark:bg-gray-900/70',
        'hover:shadow-lg hover:scale-[1.01] duration-200',
        className,
      )}
      // make the card keyboard focusable
      tabIndex={0}
      onFocus={() => {
        // slightly adjust spotlight when focused for keyboard users
        setPos({ x: 50, y: 30 });
      }}
      style={{
        backgroundImage: `radial-gradient(500px circle at ${pos.x}% ${pos.y}%, rgba(59,130,246,0.10), transparent 40%)`,
      }}
    >
      {children}
    </div>
  );
}
