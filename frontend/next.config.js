import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Your existing configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  productionBrowserSourceMaps: false,
  // Ensure outputFileTracingRoot points to the repository root to avoid workspace inference warnings
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Optional: Configure image domains if needed
  images: {
    domains: ['your-cdn-domain.com'],
  },
};

export default withNextIntl(nextConfig);
