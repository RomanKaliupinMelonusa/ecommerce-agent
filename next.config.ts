import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sfdevelopment.helzberg.com',
        pathname: '/**',
      },
    ],
  }
};

export default nextConfig;
