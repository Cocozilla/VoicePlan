/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
    output: 'standalone',
    // Only add the env block if it's a production build
    ...(isProduction && {
        env: {
            NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG,
        }
    })
};

export default nextConfig;
