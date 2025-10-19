/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid failing the build due to lint errors/warnings in CI
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable serverActions for Clerk compatibility
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure webpack to handle Clerk's dependencies in Edge runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@clerk/shared/buildAccountsBaseUrl');
    }
    return config;
  },
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
