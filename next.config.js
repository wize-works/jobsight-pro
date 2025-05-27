/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            "@": path.resolve(__dirname, "src"),
        };
        return config;
    },
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
                port: '',
                pathname: "/700x500/**",
            },
            {
                protocol: "https",
                hostname: "placehold.co",
                port: '',
                pathname: "/600x400/**",
            },
            {
                protocol: "https",
                hostname: "wize.works",
                port: '',
                pathname: "/**",
            }
        ]
    }
};

module.exports = nextConfig;
