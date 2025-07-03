'use client';

import { useState, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PollTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
}

/**
 * イベント名編集・表示コンポーネント
 */
export const PollTitle = memo(function PollTitle({
  title,
  onTitleChange,
}: PollTitleProps) {
  const [isEditing, setIsEditing] = useState(!title);

  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => setIsEditing(false), []);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value),
    [onTitleChange]
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor="poll-title" className="text-sm font-medium">
              イベント名
            </label>
            <Input
              id="poll-title"
              placeholder="例：チームミーティング"
              value={title}
              onChange={handleChange}
              onBlur={handleBlur}
              className="text-lg border-0 border-b-2 border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
              autoFocus
              aria-label="イベント名を入力"
              maxLength={48}
            />
          </div>
        ) : (
          <div
            className="text-xl font-medium text-gray-900 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={handleEdit}
            tabIndex={0}
            role="button"
            aria-label="イベント名を編集"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') handleEdit();
            }}
          >
            {title || 'イベント名を入力'}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
