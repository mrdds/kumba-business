import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Auth API proxy (kumba-auth backend)
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8001/api/auth/:path*',
      },
      // Business API proxy (kumba-business backend)
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://127.0.0.1:8000/media/:path*',
      },
    ];
  },
};

export default nextConfig;
