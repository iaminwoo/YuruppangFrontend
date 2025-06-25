import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "media.giphy.com",
      "i.giphy.com",
      "media0.giphy.com",
      "media2.giphy.com",
      // 필요에 따라 다른 Giphy 서브도메인도 추가 가능
    ],
  },
};

export default nextConfig;
