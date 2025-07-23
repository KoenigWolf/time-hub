'use client';

/**
 * DateSetup
 * - 複数日付入力フォーム
 * - 国際化・アクセシビリティ・型安全・拡張性・テスト容易性・再利用性・保守性・UI/UX最適化
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    label: '候補日',
    add: '追加',
    remove: (n: number) => `候補日${n}を削除`,
    addAria: '候補日を追加',
    placeholder: '日付を選択',
  },
  en: {
    label: 'Date Candidates',
    add: 'Add',
    remove: (n: number) => `Remove date ${n}`,
    addAria: 'Add date candidate',
    placeholder: 'Select a date',
  },
} as const;

// --- props型（拡張性・型安全・テスト容易性UP） ---
export interface DateSetupProps {
  dates: string[];
  onDateChange: (index: number, date: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
  language?: Lang;
}

/**
 * DateInputRow
 * - 単一日付入力行。アクセシビリティ・責務分離・テスト容易性
 */
interface DateInputRowProps {
  date: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  removable: boolean;
  language: Lang;
}
const DateInputRow = memo(function DateInputRow({
  date,
  index,
  onChange,
  onRemove,
  removable,
  language,
}: DateInputRowProps) {
  const t = I18N[language];
  return (
    <li className="flex items-center gap-3">
      <Input
        type="date"
        value={date}
        onChange={e => onChange(index, e.target.value)}
        className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
        aria-label={`${t.label}${index + 1}`}
        max="2100-01-01"
        placeholder={t.placeholder}
      />
      {removable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          aria-label={t.remove(index + 1)}
          className="text-gray-400 hover:text-red-500 p-1"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
});

/**
 * DateSetup
 * - 複数日付入力用フォームUI
 * - 全観点（国際化/アクセシビリティ/テスト/拡張/再利用/冗長性削減）対応
 */
export const DateSetup = memo(function DateSetup({
  dates,
  onDateChange,
  onAddDate,
  onRemoveDate,
  language = 'ja',
}: DateSetupProps) {
  const t = I18N[language];
  if (!dates?.length) return null;

  return (
    <Card className="border-0 shadow-sm" aria-label="date-setup-form">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t.label}</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddDate}
            aria-label={t.addAria}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t.add}
          </Button>
        </div>
        <ul className="grid gap-3">
          {dates.map((date, idx) => (
            <DateInputRow
              key={idx}
              date={date}
              index={idx}
              onChange={onDateChange}
              onRemove={onRemoveDate}
              removable={dates.length > 1}
              language={language}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
