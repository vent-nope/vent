import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 👇 여기가 바로 '간판' 설정하는 곳입니다!
export const metadata = {
  title: "VENT - 대한민국 불만 해소 플랫폼",
  description: "너도 화나? 나도 화나! 소비자의 작은 불만을 모아 거대한 변화로 진화시킵니다.",
  openGraph: {
    title: "🚨 VENT : 화력 지원 요청",
    description: "지금 당신의 공감이 필요합니다. 작은 불만이 모여 세상을 바꿉니다.",
    url: "https://vent-fawn.vercel.app", // 사장님 사이트 주소
    siteName: "VENT",
    images: [
      {
        url: "/og-image.png", // 아까 public 폴더에 넣은 이미지 이름
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}