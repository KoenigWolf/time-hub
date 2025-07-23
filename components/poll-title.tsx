'use client';

/**
 * PollTitle
 * - イベント名の入力コンポーネント
 * - 国際化・アクセシビリティ・型安全・再利用性・全観点最適化
 */

import { memo, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';
const I18N = {
  ja: {
    label: 'イベント名',
    placeholder: '例：チームミーティング',
    hint: 'Enterキーで確定できます',
    aria: 'イベント名を入力',
  },
  en: {
    label: 'Event Name',
    placeholder: 'e.g. Team Meeting',
    hint: 'Press Enter to confirm',
    aria: 'Enter event name',
  },
} as const;

// --- props型（型安全・テスト容易性） ---
export interface PollTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  language?: Lang;
  maxLength?: number;
}

/**
 * TitleInput
 * - 入力フィールド本体
 * - アクセシビリティ・バリデーションもここで管理
 */
const TitleInput = memo(function TitleInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxLength = 48,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  maxLength?: number;
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
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="text-lg border-2 border-gray-200 rounded-lg px-4 py-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
      aria-label={ariaLabel}
      maxLength={maxLength}
      autoComplete="off"
      spellCheck={false}
    />
  );
});

/**
 * PollTitle
 * - イベント名入力UI（国際化・アクセシビリティ・バリデーション付き）
 */
export const PollTitle = memo(function PollTitle({
  title,
  onTitleChange,
  language = 'ja',
  maxLength = 48,
}: PollTitleProps) {
  const t = I18N[language];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-3">
          <label
            htmlFor="poll-title"
            className="text-sm font-medium text-gray-700"
          >
            {t.label}
          </label>
          <TitleInput
            value={title}
            onChange={onTitleChange}
            placeholder={t.placeholder}
            ariaLabel={t.aria}
            maxLength={maxLength}
          />
          {title && (
            <p className="text-sm text-gray-500" aria-live="polite">
              {t.hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
