/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mengizinkan Next.js mengakses API Flask di port 5000
  async rewrites() {
    return [
      {
        source: '/api/flask/:path*',
        destination: 'http://127.0.0.1:5000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;