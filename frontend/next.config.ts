import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 배포용 정적 export - 서버 없이 out/ 정적 파일만 산출
  output: 'export',
  // 프로젝트 페이지(https://<user>.github.io/portfolio)로 배포 시 "/portfolio" 주입
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  // GitHub Pages는 폴더/index.html 구조가 안전함
  trailingSlash: true,
  // 정적 export에서는 Next 이미지 최적화 서버가 없음
  images: { unoptimized: true },
  transpilePackages: ['react-markdown', 'remark-gfm'],
};

export default nextConfig;
