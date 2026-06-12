// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Cloud Run Docker
  // Next 15: moved out of experimental
  serverExternalPackages: ['@google/genai'],
};

export default nextConfig;
