import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Must mirror the schemes validation.ts accepts, host-wildcarded. next/image answers 400
    // from its optimizer for any host missing here, so a narrower list would render the seed
    // perfectly and break on the first article a user creates with an image from elsewhere.
    // The wildcard is safe because the backend is what rejects non-http(s) schemes.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
