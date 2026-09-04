import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las subidas de imagen pasan por el Server Action; el límite por defecto es 1MB.
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  images: {
    // next/image necesita permitir explícitamente el host de Vercel Blob.
    // Las URLs públicas son https://<storeId>.public.blob.vercel-storage.com/...
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
