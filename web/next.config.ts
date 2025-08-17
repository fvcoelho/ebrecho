import type { NextConfig } from "next";

// Log environment configuration during startup
console.log('');
console.log('🚀 Next.js Web Application Starting...');
console.log('='.repeat(50));

console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Port: ${process.env.PORT || 3000}`);
console.log('');

console.log('🌐 API Endpoints:');
console.log(`   NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || '❌ Not set (using default)'}`);
console.log(`   API_URL (SSR): ${process.env.API_URL || '❌ Not set (using default)'}`);

const clientApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const serverApiUrl = process.env.API_URL || 'http://localhost:3001/api';

console.log('');
console.log('📍 Resolved URLs:');
console.log(`   Client-side API: ${clientApiUrl}`);
console.log(`   Server-side API: ${serverApiUrl}`);

console.log('');
console.log('🔑 Other Environment Variables:');
console.log(`   VERCEL: ${process.env.VERCEL ? '✅ Running on Vercel' : '❌ Not on Vercel'}`);
console.log(`   DOCKER_ENV: ${process.env.DOCKER_ENV ? '✅ Running in Docker' : '❌ Not in Docker'}`);
console.log(`   API_HOST: ${process.env.API_HOST || 'Not set (using defaults)'}`);

console.log('');
console.log('📋 Available Routes:');
console.log(`   Public: http://localhost:${process.env.PORT || 3000}/`);
console.log(`   Login: http://localhost:${process.env.PORT || 3000}/login`);
console.log(`   Dashboard: http://localhost:${process.env.PORT || 3000}/dashboard`);
console.log(`   Produtos: http://localhost:${process.env.PORT || 3000}/produtos`);
console.log(`   Vendas: http://localhost:${process.env.PORT || 3000}/vendas`);

console.log('='.repeat(50));
console.log('');

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
