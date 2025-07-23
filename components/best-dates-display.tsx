'use client';

/**
 * BestDatesDisplay
 * - 最適な候補日（最多出席可能人数の日）の一覧をUI表示
 * - 国際化・型安全・拡張性・テスト容易性・アクセシビリティ・再利用性を重視
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    optimal: '最適な候補日',
    people: '名',
    trophy: 'トロフィー',
    dateList: '候補日一覧',
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  en: {
    optimal: 'Best Date(s)',
    people: '',
    trophy: 'Trophy',
    dateList: 'Date List',
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
} as const;

// --- 最適日データ型 ---
export interface BestDate {
  index: number;
  available: number;
}

// --- 表示用props型（拡張・テスト容易性のためexport）---
export interface BestDatesDisplayProps {
  bestDates: BestDate[];
  dates: string[];
  language?: Lang;
  renderDateLabel?: (date: string, language?: Lang) => React.ReactNode;
}

// --- 最適な候補日バッジ（再利用性・テスト容易性向上）---
const BestDateBadge = memo(function BestDateBadge({
  date,
  available,
  language = 'ja',
  renderDateLabel,
}: {
  date: string;
  available: number;
  language?: Lang;
  renderDateLabel?: (date: string, language?: Lang) => React.ReactNode;
}) {
  const t = I18N[language];
  return (
    <Badge
      variant="outline"
      className="bg-white border-green-200 text-green-800"
      aria-label={`${t.formatDate(date)} (${available}${t.people})`}
    >
      {renderDateLabel ? renderDateLabel(date, language) : t.formatDate(date)}（{available}{t.people}）
    </Badge>
  );
});

/**
 * BestDatesDisplay
 * - 最適な候補日（最多人数が出席可能な日）を表示するコンポーネント。
 * - bestDates: index（dates配列のインデックス）、available（出席可能人数）のリスト
 * - dates: 候補日文字列リスト
 * - language: 言語設定
 * - renderDateLabel: 日付表示のカスタマイズ用
 * - UI／アクセシビリティ／再利用性／テスト容易性／国際化に配慮
 */
export const BestDatesDisplay = memo(function BestDatesDisplay({
  bestDates,
  dates,
  language = 'ja',
  renderDateLabel,
}: BestDatesDisplayProps) {
  const t = I18N[language];

  // 候補がなければ何も表示しない
  if (!bestDates?.length) return null;

  return (
    <Card className="border-0 shadow-sm bg-green-50" aria-label={t.optimal}>
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="h-5 w-5 text-yellow-600" aria-label={t.trophy} />
          <span className="font-medium text-green-900">{t.optimal}</span>
        </div>
        <ul className="flex flex-wrap gap-2 justify-center" aria-label={t.dateList}>
          {bestDates.map(({ index, available }) => (
            <li key={index}>
              <BestDateBadge
                date={dates[index]}
                available={available}
                language={language}
                renderDateLabel={renderDateLabel}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
