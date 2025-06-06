/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@cloudflare/workers-types"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-aa3e90cbe7a3485dbebd3a2a844e0e41.r2.dev",
      },
      {
        protocol: "https",
        hostname: "blob.v0.dev",
      },
    ],
    formats: ["image/webp", "image/avif"],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Configuración para Vercel
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig
