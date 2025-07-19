import { withSentryConfig } from "@sentry/nextjs";
import withSerwist from "@serwist/next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Disable ESLint during builds
        ignoreDuringBuilds: true,
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
        };

        // Exclude server-only modules from client-side bundle
        if (!config.isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                child_process: false,
            };
        }

        // Suppress Supabase realtime warnings since we don't use realtime
        config.ignoreWarnings = [
            /Critical dependency: the request of a dependency is an expression/,
            /Module not found: Error: Can't resolve.*@supabase\/realtime-js/,
        ];

        // Configure specific module tree shaking
        config.module.rules = config.module.rules || [];
        config.module.rules.push({
            test: /\.js$/,
            include: [
                /node_modules\/(date-fns|lodash|react-icons|@supabase)/,
            ],
            sideEffects: false,
        });

        // Add specific optimizations for large libraries
        if (config.resolve.alias) {
            // Tree shake date-fns by using ES modules - simplified for ES module context
            config.resolve.alias['date-fns'] = 'date-fns';
        }

        return config;
    },
    experimental: {
        optimizePackageImports: [
            '@clerk/nextjs',
            'date-fns',
            'react-chartjs-2',
            'recharts',
            'react-leaflet',
            'leaflet',
            '@supabase/supabase-js',
            'chart.js'
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Security and PWA headers
    async headers() {
        return [
            // CSP for authentication routes with Cloudflare Turnstile support
            {
                source: '/(sign-in|sign-up|api/auth)/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.clarity.ms https://c.clarity.ms https://kit.fontawesome.com https://browser.sentry-cdn.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://challenges.cloudflare.com; " +
                            "connect-src 'self' https://www.clarity.ms https://c.clarity.ms https://dc.clarity.ms https://y.clarity.ms https://q.clarity.ms https://sentry.io https://*.sentry.io https://*.stwwmediaprodwu301.blob.core.windows.net https://kit.fontawesome.com https://ka-p.fontawesome.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api.clerk.dev https://clerk.jobsight.co https://*.tile.openstreetmap.org https://*.openstreetmap.org https://challenges.cloudflare.com; " +
                            "img-src 'self' data: https: blob: https://www.clarity.ms https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://*.tile.openstreetmap.org https://*.openstreetmap.org; " +
                            "style-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://ka-p.fontawesome.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co; " +
                            "font-src 'self' data: https://kit.fontawesome.com https://ka-p.fontawesome.com https://res-1.cdn.office.net https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co; " +
                            "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://challenges.cloudflare.com; " +
                            "object-src 'none'; " +
                            "base-uri 'self'; " +
                            "worker-src 'self' blob:;"
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)'
                    }
                ],
            },
            // CSP for all other routes
            {
                source: '/((?!sign-in|sign-up|api/auth).*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.clarity.ms https://c.clarity.ms https://kit.fontawesome.com https://browser.sentry-cdn.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://challenges.cloudflare.com; " +
                            "connect-src 'self' https://www.clarity.ms https://c.clarity.ms https://dc.clarity.ms https://y.clarity.ms https://q.clarity.ms https://sentry.io https://*.sentry.io https://*.stwwmediaprodwu301.blob.core.windows.net https://kit.fontawesome.com https://ka-p.fontawesome.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api.clerk.dev https://clerk.jobsight.co https://*.tile.openstreetmap.org https://*.openstreetmap.org https://challenges.cloudflare.com; " +
                            "img-src 'self' data: https: blob: https://www.clarity.ms https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://*.tile.openstreetmap.org https://*.openstreetmap.org; " +
                            "style-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://ka-p.fontawesome.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co; " +
                            "font-src 'self' data: https://kit.fontawesome.com https://ka-p.fontawesome.com https://res-1.cdn.office.net https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co; " +
                            "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.jobsight.co https://challenges.cloudflare.com; " +
                            "object-src 'none'; " +
                            "base-uri 'self'; " +
                            "worker-src 'self' blob:;"
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)'
                    }
                ],
            },
        ];
    },
    // Security headers
    async rewrites() {
        return [
            {
                source: '/api/media/:path*',
                destination: 'https://stwwmediaprodwu301.blob.core.windows.net/:path*',
            },
        ];
    },
};

// Serwist configuration
const serwistWrappedConfig = withSerwist({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development"
});

// Chain configurations: Serwist wraps Sentry-configured Next.js config
const sentryConfig = withSentryConfig(
    nextConfig,
    {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: "jobsight-technologies",
        project: "jobsight-pro",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        tunnelRoute: "/monitoring",

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
    }
);

export default serwistWrappedConfig(sentryConfig);
