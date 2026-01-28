import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Mode standalone pour Docker
  output: "standalone",

  // Securiser les images externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Ajoute d'autres domaines autorises ici
    ],
  },
};

export default nextConfig;
