import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        dangerouslyAllowSVG: true,
        localPatterns: [
            {
                pathname: "/public/**",
                search: '',
            },
            {
                pathname: "/images/**",
                search: '',
            },
        ],
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
