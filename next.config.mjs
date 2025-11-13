/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sandbox.midtrans.com",
      },
      {
        protocol: "https",
        hostname: "merchants-app.sbx.midtrans.com",
      },
    ],
  },
};

export default nextConfig;
