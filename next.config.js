const webpack = require('webpack');

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

    // Handle Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    
    return config;
  },
  // Disable general build cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  }
};

module.exports = nextConfig;