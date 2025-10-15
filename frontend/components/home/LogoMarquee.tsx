export function LogoMarquee() {
  const logos = ['JavaScript', 'Python', 'DSA', 'Aptitude', 'Reasoning', 'GK', 'Maths'];

  return (
    <div className="relative overflow-hidden rounded-xl border bg-white/70 p-3 dark:bg-gray-900/70">
      <div className="marquee gap-8 px-2" aria-hidden="true">
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={`${logo}-${index}`}
            className="whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
            tabIndex={-1}
          >
            • {logo}
          </div>
        ))}
      </div>
      {/* Provide a simple accessible list for screen readers */}
      <ul className="sr-only" aria-label="Supported topics">
        {logos.map((logo) => (
          <li key={logo}>{logo}</li>
        ))}
      </ul>
    </div>
  );
}
