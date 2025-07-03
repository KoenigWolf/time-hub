'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

/**
 * 候補日が未設定のときに表示する空状態コンポーネント。
 */
export const EmptyState = memo(function EmptyState() {
  return (
    <Card className="border-0 shadow-sm border-dashed border-gray-200" aria-label="空状態">
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden />
        <p className="text-gray-500 font-light">
          候補日を設定して、回答を開始しましょう
        </p>
      </CardContent>
    </Card>
  );
});
