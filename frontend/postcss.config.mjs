// Next.js requires PostCSS plugins to be provided as strings
// Tailwind CSS v4 uses the dedicated PostCSS plugin package
export default {
  plugins: [
    '@tailwindcss/postcss',
    'autoprefixer',
  ],
};
