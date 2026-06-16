/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: true,
  },
  experimental: { serverComponentsExternalPackages: ["@prisma/client", "prisma"] },
};

export default nextConfig;
