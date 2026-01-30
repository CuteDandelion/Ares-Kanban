/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Ares-Kanban',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
}

module.exports = nextConfig
