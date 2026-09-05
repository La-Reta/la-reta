import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El dominio compartido (@repo/reta) se publica como TypeScript sin compilar,
  // igual que lo consume Metro en la app: Next tiene que transpilarlo él mismo.
  transpilePackages: ["@repo/reta"],
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
