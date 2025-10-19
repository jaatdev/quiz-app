/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  eslint: {
    // Avoid failing the build due to lint errors/warnings in CI
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: path.join(__dirname, '..'), // monorepo root
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
