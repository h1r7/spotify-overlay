import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // 폰트 변경
import "./globals.css";
import { SettingsProvider } from "../context/SettingsContext";
import GlobalBackground from "../components/GlobalBackground";

// 스포티파이와 가장 비슷한 무료 폰트
const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "R1G3L-Flux | Spotify Overlay",
  description: "Premium OBS Overlay for Spotify",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={font.className}>
        <SettingsProvider>
          <GlobalBackground />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}