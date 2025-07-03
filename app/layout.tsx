import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/** フォント定義を一元化 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** サイト全体のメタデータ（SEO・SNS向けも含む） */
export const metadata: Metadata = {
  title: "time-hub - 高速シンプルな日程調整アプリ",
  description:
    "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。アカウント登録不要、スマートフォン対応。",
  keywords: [
    "日程調整",
    "スケジュール",
    "会議",
    "イベント",
    "時間",
    "調整",
    "無料",
  ],
  authors: [{ name: "time-hub" }],
  creator: "time-hub",
  publisher: "time-hub",
  robots: "index, follow",
  openGraph: {
    title: "time-hub - 高速シンプルな日程調整アプリ",
    description:
      "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "time-hub - 高速シンプルな日程調整アプリ",
    description:
      "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

/** アプリ全体のルートレイアウト */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "antialiased min-h-screen",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
