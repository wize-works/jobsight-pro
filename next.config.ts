import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
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
                search: '',
            },
            {
                protocol: "https",
                hostname: "placehold.co",
                port: '',
                pathname: "/600x400/**",
                search: '',
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

export default nextConfig;
