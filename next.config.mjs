/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Não bloqueia build por erros de tipo ou lint (verificação acontece localmente)
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: true,
  },

  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
