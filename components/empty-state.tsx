'use client';

/**
 * EmptyState
 * - 候補日が未設定の場合の空状態UI
 * - 国際化・アクセシビリティ・拡張性・再利用性・テスト容易性を意識した設計
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    label: '空状態',
    message: '候補日を設定して、回答を開始しましょう',
  },
  en: {
    label: 'Empty',
    message: 'Set candidate dates to start collecting responses.',
  },
} as const;

// --- props型（拡張/テスト容易性・国際化） ---
export interface EmptyStateProps {
  language?: Lang;
  children?: React.ReactNode;
}

/**
 * EmptyState
 * - 空状態（データ未設定時）を表す再利用可能なコンポーネント
 * - 国際化, childrenでカスタムUIも可
 */
export const EmptyState = memo(function EmptyState({
  language = 'ja',
  children,
}: EmptyStateProps) {
  const t = I18N[language];

  return (
    <Card className="border-0 shadow-sm border-dashed border-gray-200" aria-label={t.label}>
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden />
        <p className="text-gray-500 font-light">
          {children || t.message}
        </p>
      </CardContent>
    </Card>
  );
});
