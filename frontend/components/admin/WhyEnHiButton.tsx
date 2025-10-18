import React, { useState } from 'react';
import WhyEnHiModal from '@/components/WhyEnHiModal';

export default function WhyEnHiButton() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem('hideWhyEnHi'); } catch { return true; }
  });

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-gray-600 hover:underline"
      >
        Why EN+HI?
      </button>
      <WhyEnHiModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
