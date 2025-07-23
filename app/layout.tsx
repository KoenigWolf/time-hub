// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ---- フォント設定 ----
const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // パフォーマンス最適化
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ---- メタデータ定義 ----
export const metadata: Metadata = {
  title: "time-hub - 高速シンプルな日程調整アプリ",
  description: "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。アカウント登録不要、スマートフォン対応。",
  keywords: [
    "日程調整",
    "スケジュール",
    "会議",
    "イベント",
    "時間",
    "調整",
    "無料",
    "スケジューラー",
    "カレンダー"
  ],
  authors: [{ name: "time-hub" }],
  creator: "time-hub",
  publisher: "time-hub",
  robots: "index, follow",
  openGraph: {
    title: "time-hub - 高速シンプルな日程調整アプリ",
    description: "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。",
    type: "website",
    locale: "ja_JP",
    url: "https://time-hub.jp/",
    siteName: "time-hub",
    images: [
      {
        url: "https://time-hub.jp/og-image.png",
        width: 1200,
        height: 630,
        alt: "time-hub オープングラフ画像"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "time-hub - 高速シンプルな日程調整アプリ",
    description: "URLを送るだけで瞬時に最適な日程が見つかる、高速でシンプルな日程調整アプリ。",
    images: ["https://time-hub.jp/og-image.png"]
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

// ---- Props 型定義 ----
type RootLayoutProps = {
  children: React.ReactNode;
};

/**
 * アプリ全体のレイアウトコンポーネント
 * - フォント変数で全体に一貫したスタイル
 * - 子要素でページ・UIを切り替え
 * - セキュリティ: lang属性・メタデータを正しく設定
 * - 拡張性: レイアウトへのchildren追加で容易に拡張可能
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body className={`${geist.variable} ${geistMono.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
