'use client';

import { memo, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react'; // より「読み込み中」らしいアイコン
import TimeHubApp from '@/app/time-hub-app';

// 国際化・文言管理例
const messages = {
  loading: '読み込み中...',
  // en: 'Loading...', // 英語対応など
};

/**
 * 読み込み時の共通スケルトン
 * - 汎用Loaderコンポーネント（Badge, Spinner等があればそちらもOK）
 * - memo化しパフォーマンス向上
 * - テスト容易・再利用可
 */
export const LoadingFallback = memo(function LoadingFallback() {
  return (
    <section
      aria-label="Loading"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #fff 70%, #ede9fe 100%)',
      }}
      data-testid="loading-fallback"
    >
      <Card>
        <CardContent style={{ padding: 32, textAlign: 'center' }}>
          <Loader2
            size={48}
            className="mx-auto mb-6 animate-spin text-blue-500"
            aria-hidden
            data-testid="loading-icon"
          />
          <p className="text-lg font-medium text-gray-600">{messages.loading}</p>
        </CardContent>
      </Card>
    </section>
  );
});

/**
 * アプリのホームルート
 * Suspense で fallback を活用
 */
export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TimeHubApp />
    </Suspense>
  );
}
