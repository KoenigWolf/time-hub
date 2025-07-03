'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface BestDate {
  index: number;
  available: number;
}

interface BestDatesDisplayProps {
  bestDates: BestDate[];
  dates: string[];
}

/**
 * 最適な候補日（最多人数が出席可能な日）を表示するコンポーネント。
 * - bestDates: index（dates配列のインデックス）、available（出席可能人数）のリスト
 * - dates: 候補日文字列リスト
 */
export const BestDatesDisplay = memo(function BestDatesDisplay({
  bestDates,
  dates,
}: BestDatesDisplayProps) {
  if (!bestDates?.length) return null;

  return (
    <Card className="border-0 shadow-sm bg-green-50" aria-label="最適な候補日">
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="h-5 w-5 text-yellow-600" aria-label="trophy" />
          <span className="font-medium text-green-900">最適な候補日</span>
        </div>
        <ul className="flex flex-wrap gap-2 justify-center">
          {bestDates.map(({ index, available }) => (
            <li key={index}>
              <Badge
                variant="outline"
                className="bg-white border-green-200 text-green-800"
              >
                {formatDate(dates[index])}（{available}名）
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
