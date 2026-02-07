import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const withPWA = require("next-pwa")({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
  buildExcludes: [/chunks\/.*$/],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
