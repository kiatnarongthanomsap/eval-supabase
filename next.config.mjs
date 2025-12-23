/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    basePath: '/kuscc-eval',
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
        ],
    },
};

export default nextConfig;