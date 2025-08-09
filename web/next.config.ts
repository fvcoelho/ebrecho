import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '165.227.65.227',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.ebrecho.com.br',
        pathname: '/uploads/**',
      }
    ],
  },
  async rewrites() {
    // Check if we're running in Docker (development or production)
    const apiHost = process.env.API_HOST || 
      (process.env.NODE_ENV === 'production' ? 'ebrecho_api' : 
       process.env.DOCKER_ENV ? 'api' : 'localhost');
    
    return [
      {
        source: '/api/:path*',
        destination: `http://${apiHost}:3001/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `http://${apiHost}:3001/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
