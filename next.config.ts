import type { NextConfig } from "next";

function normalizeConfigUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
}

function s3RemotePattern(): URL | null {
  const rawValue = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!rawValue) {
    return null;
  }

  const baseUrl = normalizeConfigUrl(rawValue).replace(/\/+$/, "");
  return new URL(`${baseUrl}/**`);
}

const remotePattern = s3RemotePattern();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: remotePattern ? [remotePattern] : [],
  },
};

export default nextConfig;
