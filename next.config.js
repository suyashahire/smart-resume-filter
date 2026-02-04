/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled in development for better performance (prevents double-renders)
  // Enable in production for better debugging
  reactStrictMode: false,
  
  // Optimize for faster builds
  swcMinify: true,
  
  // Reduce bundle size by excluding large dependencies from client
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
}

module.exports = nextConfig

