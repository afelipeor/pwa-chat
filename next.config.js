const isProd = process.env.NODE_ENV === 'production';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,
  buildExcludes: [/middleware-manifest\.json$/, /build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: false, // Disable strict mode to prevent double renders
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? '' : '',
  output: 'export',

  // Custom server configuration to reduce noise
  experimental: {
    esmExternals: false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce webpack noise in development
      config.stats = 'errors-warnings';

      // Configure webpack dev server
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/server/**'],
      };
    }

    return config;
  },

  // Reduce Next.js development noise
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Custom rewrites to handle dev tool requests
  async rewrites() {
    return {
      beforeFiles: [
        // Redirect Chrome DevTools requests to return 204
        {
          source: '/.well-known/:path*',
          destination: '/api/dev-silence',
        },
        {
          source: '/_next/static/webpack/:path*',
          destination: '/api/dev-silence',
        },
      ],
    };
  },
});
