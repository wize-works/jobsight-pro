import { join } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        config.resolve.alias['@'] = join(__dirname, 'src'); // 👈 Add this line
        return config;
    },
};

export default nextConfig;
