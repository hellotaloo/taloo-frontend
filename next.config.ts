import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow widget scripts to be loaded cross-origin
        source: '/taloo-widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      {
        source: '/widgets/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      {
        // Allow the apply page to be iframed from any origin
        source: '/apply/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *;',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Public widget popup content endpoint
          source: '/widget/:path*',
          destination: `${BACKEND_URL}/widget/:path*`,
        },
        {
          // Screening initiate (called from widget on client sites)
          source: '/screening/initiate',
          destination: `${BACKEND_URL}/screening/initiate`,
        },
      ],
    };
  },
};

export default nextConfig;
