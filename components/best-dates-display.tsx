'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

// 最適日データ型
export interface BestDate {
  index: number;
  available: number;
}

// 表示用props型（拡張・テスト容易性のためexport）
export interface BestDatesDisplayProps {
  bestDates: BestDate[];
  dates: string[];
}

// 最適な候補日バッジ（再利用性・テスト容易性向上）
const BestDateBadge = ({ date, available }: { date: string; available: number }) => (
  <Badge variant="outline" className="bg-white border-green-200 text-green-800">
    {formatDate(date)}（{available}名）
  </Badge>
);

/**
 * 最適な候補日（最多人数が出席可能な日）を表示するコンポーネント。
 * - bestDates: index（dates配列のインデックス）、available（出席可能人数）のリスト
 * - dates: 候補日文字列リスト
 * - UI／アクセシビリティ／再利用性に配慮
 */
export const BestDatesDisplay = memo(function BestDatesDisplay({
  bestDates,
  dates,
}: BestDatesDisplayProps) {
  // 候補がなければ何も表示しない
  if (!bestDates?.length) return null;

  return (
    <Card className="border-0 shadow-sm bg-green-50" aria-label="最適な候補日">
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="h-5 w-5 text-yellow-600" aria-label="trophy" />
          <span className="font-medium text-green-900">最適な候補日</span>
        </div>
        <ul className="flex flex-wrap gap-2 justify-center" aria-label="候補日一覧">
          {bestDates.map(({ index, available }) => (
            <li key={index}>
              <BestDateBadge date={dates[index]} available={available} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
