/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Only use basePath in production
    basePath: process.env.NODE_ENV === 'production' ? '/kuscc-eval' : '',
    trailingSlash: true,
    images: {
        // เพิ่มส่วนนี้ครับ 👇
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'apps2.coop.ku.ac.th', // อนุญาตเว็บนี้
                port: '',
                pathname: '/**', // อนุญาตทุกรูปในเว็บนี้
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos', // สำหรับ placeholder images
                port: '',
                pathname: '/**',
            },
        ],
    },
    // Skip API routes during build to prevent requiring env vars
    experimental: {
        // Disable static optimization for API routes
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
};

export default nextConfig;