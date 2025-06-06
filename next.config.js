
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': require('path').resolve(__dirname, 'src'),
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

            // Exclude playwright from client bundle
            config.externals = config.externals || [];
            config.externals.push('playwright-core');
        }

        return config;
    },
    experimental: {
        optimizePackageImports: ['@kinde-oss/kinde-auth-nextjs']
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // PWA Configuration
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    // Security headers
    async rewrites() {
        return [
            {
                source: '/api/auth/:path*',
                destination: '/api/auth/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
