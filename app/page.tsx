'use client';

import { memo, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import TimeHubApp from '@/app/time-hub-app';

/** 読み込み中のフェードイン表示 */
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" aria-hidden />
          <p className="text-lg font-medium text-gray-600">読み込み中...</p>
        </CardContent>
      </Card>
    </div>
  );
});

/**
 * アプリのホームルート
 * Suspenseで読み込み中はLoadingFallbackを表示
 */
export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TimeHubApp />
    </Suspense>
  );
}
