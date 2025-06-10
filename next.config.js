const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
    responseLimit: '500mb',
  },
  typescript: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>[^.]+).vibegame.fun',
            },
          ],
          destination: '/games/:subdomain',
        },
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>[^.]+).localhost(:\\d+)?',
            },
          ],
          destination: '/games/:subdomain',
        },
      ],
    };
  },
  webpack: (config, { isServer }) => {
    // Disable all webpack caching
    config.cache = false;
    
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
  }
};

module.exports = nextConfig;