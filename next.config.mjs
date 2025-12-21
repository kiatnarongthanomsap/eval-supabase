/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'apps2.coop.ku.ac.th',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
