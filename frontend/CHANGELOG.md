# Changelog

## Unreleased

- UI: Added premium animated homepage with:
  - Floating gradient hero with soft glow orbs
  - Animated counters that count when scrolled into view
  - Spotlight hover/parallax effect on subject cards (keyboard accessible)
  - Pure-CSS logo marquee with screen-reader list fallback
  - Testimonials grid and final CTA
- Accessibility: Respects prefers-reduced-motion, added sr-only fallbacks and keyboard focus states
- Perf: Animations use transforms and are GPU-friendly; Framer Motion usage limited to entrance/counters
