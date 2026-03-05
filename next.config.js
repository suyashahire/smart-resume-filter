/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize for faster builds
  swcMinify: true,
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Reduce bundle size by excluding large dependencies from client
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Security headers
  async headers() {
    // Extract origin (scheme+host+port) from API URL for CSP connect-src
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let apiOrigin;
    try { apiOrigin = new URL(apiUrl).origin; } catch { apiOrigin = 'http://localhost:8000'; }
    const apiHost = process.env.NEXT_PUBLIC_API_HOST || new URL(apiOrigin).host;

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '0' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' " + apiOrigin + " wss://" + apiHost + " ws://localhost:*",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
}

nextConfig.poweredByHeader = false;

module.exports = nextConfig

