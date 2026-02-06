import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

const isDev = process.env.NODE_ENV === "development";

const pwaConfig = withPWA({
  ...nextConfig,
  pwa: {
    dest: "public",
    disable: false,
    register: true,
    skipWaiting: true,
  },
});

export default isDev ? nextConfig : pwaConfig;
