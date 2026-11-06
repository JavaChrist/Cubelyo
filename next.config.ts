import type { NextConfig } from "next";
const android = process.env.CUBELYO_BUILD_TARGET === "android";
const config: NextConfig = {
  ...(android
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};
export default config;
