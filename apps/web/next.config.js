/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@zapti/shared'],
  output: 'standalone',
  optimizeFonts: false,
  async rewrites() {
    // Use relative path for production - proxied via nginx or direct
    // In development, use the internal Docker hostname
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api:3000/api/v1';
    const isExternal = apiUrl.startsWith('http://') || apiUrl.startsWith('https://');
    const destination = isExternal ? `${apiUrl}/:path*` : 'http://api:3000/api/v1/:path*';

    return [
      {
        source: '/api/v1/:path*',
        destination,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
