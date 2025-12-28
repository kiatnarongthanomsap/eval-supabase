/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // basePath: กำหนดจาก environment variable หรือใช้ค่าเดิมสำหรับ production
    // สำหรับ Render.com: ไม่ต้องตั้ง NEXT_PUBLIC_BASE_PATH (จะใช้ root path '/')
    // สำหรับ deployment อื่นที่ต้องการ subpath: ตั้ง NEXT_PUBLIC_BASE_PATH=/kuscc-eval
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/kuscc-eval' : ''),
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
    webpack: (config) => {
        // Silence known third-party build-time warnings (Genkit/OpenTelemetry dependency graph)
        // without affecting runtime behavior.
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            (warning) => {
                const msg = typeof warning?.message === 'string' ? warning.message : '';
                const resource = warning?.module?.resource || warning?.module?.identifier?.() || '';
                return (
                    msg.includes('Critical dependency: require function is used') &&
                    String(resource).includes('require-in-the-middle')
                );
            },
        ];
        return config;
    },
};

export default nextConfig;