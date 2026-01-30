import { Inter } from "next/font/google";
import "./globals.css";
// 👇 1. 이거 추가 (분석 도구 가져오기)
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  // ... (아까 작성한 제목/설명 부분은 그대로 두세요!) ...
  title: "VENT - 대한민국 불만 해소 플랫폼",
  description: "너도 화나? 나도 화나! 소비자의 작은 불만을 모아 거대한 변화로 진화시킵니다.",
  openGraph: {
    // ... (기존 내용 유지) ...
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        {/* 👇 2. 이거 추가 (여기에 추적기를 답니다) */}
        <Analytics />
      </body>
    </html>
  );
}