'use client';

import confetti from 'canvas-confetti';

export function fireConfettiBurst() {
  try {
    const duration = 1200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        startVelocity: 35,
        spread: 55,
        ticks: 200,
        scalar: 0.9,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  } catch {
    // ignore
  }
}
