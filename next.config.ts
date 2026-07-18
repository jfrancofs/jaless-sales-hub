import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.18.10',
    '192.168.18.10:3000',
  ],
};

export default nextConfig;