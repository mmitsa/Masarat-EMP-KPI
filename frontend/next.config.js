/** @type {import('next').NextConfig} */
// Masarat ERP - Unified Dashboard v2
const path = require('path');
const { i18n } = require('./next-i18next.config');
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  customWorkerSrc: 'public',
  customWorkerPrefix: 'sw-custom',
  runtimeCaching: [
    // ═══ استثناء صفحات المصادقة و API auth من التخزين المؤقت ═══
    {
      urlPattern: /\/api\/auth\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/(login|logout|register|dashboard|change-password)/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // ═══ لا نخزن API responses — تسبب مشاكل مع المصادقة ═══
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  // Internationalization configuration
  i18n,
  // Fix workspace root detection warning
  outputFileTracingRoot: path.resolve(__dirname),
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Configure image optimization
  images: {
    domains: ['localhost', 'api.localhost', 'unified.mmit.sa'],
    // تفعيل تحسين الصور في الإنتاج، تعطيلها في التطوير فقط
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  // Configure environment variables
  env: {
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080',
  },
  // Redirect configuration removed - landing page now at /
  async redirects() {
    return [];
  },
  // Rewrites: ZKTeco PUSH protocol (ADMS/iClock) — devices send to /iclock/*
  async rewrites() {
    return [
      { source: '/iclock/:path*', destination: '/api/iclock/:path*' },
    ];
  },
  // Experimental features
  experimental: {
    esmExternals: true,
  },
  // Development caching optimization
  onDemandEntries: {
    maxInactiveAge: 5 * 60 * 1000,
    pagesBufferLength: 5,
  },
  // ═══════════════════════════════════════════════════════════════════
  // Security Headers - رؤوس الأمان
  // ═══════════════════════════════════════════════════════════════════
  async headers() {
    // Content Security Policy
    // NOTE: 'unsafe-inline' is required for Next.js styled-jsx.
    // TODO: Replace 'unsafe-inline' with nonce-based CSP in a future iteration
    // by using next.config.js experimental.appDir or a custom server with nonce injection.
    // Build connect-src with all configured API URLs
    const connectSrcUrls = [
      "'self'",
      process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080',
      process.env.NEXT_PUBLIC_CHAT_API_URL || '',
      process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || '',
      process.env.NEXT_PUBLIC_IDENTITY_URL || '',
      'ws:', 'wss:',
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    // Only add upgrade-insecure-requests if NEXTAUTH_URL is HTTPS
    const useHttps = (process.env.NEXTAUTH_URL || '').startsWith('https://');

    const cspHeader = process.env.NODE_ENV === 'production'
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          `connect-src ${connectSrcUrls}`,
          "worker-src 'self'",
          "manifest-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          ...(useHttps ? ["upgrade-insecure-requests"] : []),
        ].join('; ')
      : ''; // Disable CSP in development for easier debugging

    const securityHeaders = [
      // 🛡️ Prevent XSS attacks
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      // 🛡️ Prevent clickjacking
      { key: 'X-Frame-Options', value: 'DENY' },
      // 🛡️ Prevent MIME type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // 🛡️ Control referrer information
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // 🛡️ Permissions Policy (formerly Feature-Policy)
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      // 🛡️ HSTS - Force HTTPS (only when using HTTPS)
      ...((process.env.NEXTAUTH_URL || '').startsWith('https://') ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      }] : []),
      // 🛡️ Content Security Policy (production only)
      ...(cspHeader ? [{ key: 'Content-Security-Policy', value: cspHeader }] : []),
    ];

    // ═══════════════════════════════════════════════════════════
    // سياسة منع الكاش الشاملة:
    // - كل صفحات HTML → no-store (يمنع Cloudflare و Service Worker)
    // - كل API routes → no-store
    // - ملفات JS/CSS → تُخزن بأمان لأن أسماءها تحتوي content hash
    // - ملفات Static → تخزين طويل
    // ═══════════════════════════════════════════════════════════

    // Headers مشتركة لمنع الكاش على صفحات HTML
    const noCacheHeaders = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];

    return [
      // ═══ كل صفحات HTML: منع التخزين المؤقت نهائياً ═══
      // يضمن تحميل أحدث نسخة دائماً من الخادم
      // ملفات _next/static و _next/data لها content hash → لا تتأثر
      {
        source: '/:path((?!_next|static|images|icons|fonts|favicon|sw|workbox).*)',
        headers: [
          ...noCacheHeaders,
          ...securityHeaders,
        ],
      },
      // API routes - CORS + no-cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          ...noCacheHeaders,
          ...securityHeaders,
        ],
      },
      // ═══ _next/static → تخزين آمن لأن الأسماء تحتوي content hash ═══
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ...securityHeaders,
        ],
      },
      // Static assets - aggressive caching
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ...securityHeaders,
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
