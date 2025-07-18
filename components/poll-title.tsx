'use client';

import { memo, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// props型export
export interface PollTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
}

// 入力フィールド分離。props型を直接記述で型エラー回避
const TitleInput = memo(function TitleInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    []
  );
  return (
    <Input
      id="poll-title"
      placeholder="例：チームミーティング"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="text-lg border-2 border-gray-200 rounded-lg px-4 py-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
      aria-label="イベント名を入力"
      maxLength={48}
    />
  );
});

// メインコンポーネント
export const PollTitle = memo(function PollTitle({
  title,
  onTitleChange,
}: PollTitleProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-3">
          <label
            htmlFor="poll-title"
            className="text-sm font-medium text-gray-700"
          >
            イベント名
          </label>
          <TitleInput value={title} onChange={onTitleChange} />
          {title && (
            <p className="text-sm text-gray-500" aria-live="polite">
              Enterキーで確定できます
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
