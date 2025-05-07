/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Disable all webpack caching
    config.cache = false;
    
    // Clear module cache
    config.module = {
      ...config.module,
      unsafeCache: false
    };
    
    return config;
  },
  // Disable general build cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  }
};

module.exports = nextConfig;