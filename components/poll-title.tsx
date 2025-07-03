'use client';

import { useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PollTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
}

/**
 * イベント名編集・表示コンポーネント（1回入力対応）
 */
export const PollTitle = memo(function PollTitle({
  title,
  onTitleChange,
}: PollTitleProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value),
    [onTitleChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Enterキーで入力を確定（フォーカスを外す）
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    },
    []
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-3">
          <label htmlFor="poll-title" className="text-sm font-medium text-gray-700">
            イベント名
          </label>
          <Input
            id="poll-title"
            placeholder="例：チームミーティング"
            value={title}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="text-lg border-2 border-gray-200 rounded-lg px-4 py-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
            aria-label="イベント名を入力"
            maxLength={48}
          />
          {title && (
            <p className="text-sm text-gray-500">
              Enterキーで確定できます
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
