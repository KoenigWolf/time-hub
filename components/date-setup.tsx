'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface DateSetupProps {
  dates: string[];
  onDateChange: (index: number, date: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
}

/**
 * 日程候補入力用コンポーネント。
 * - dates: 候補日文字列配列
 * - onDateChange: 候補日更新コールバック
 * - onAddDate: 候補日追加コールバック
 * - onRemoveDate: 候補日削除コールバック
 */
export const DateSetup = memo(function DateSetup({
  dates,
  onDateChange,
  onAddDate,
  onRemoveDate,
}: DateSetupProps) {
  if (!dates?.length) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">候補日</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddDate}
            aria-label="候補日を追加"
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
        <ul className="grid gap-3">
          {dates.map((date, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <Input
                type="date"
                value={date}
                onChange={e => onDateChange(idx, e.target.value)}
                className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
                aria-label={`候補日${idx + 1}`}
                max={new Date(2100, 0, 1).toISOString().slice(0, 10)}
              />
              {dates.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDate(idx)}
                  aria-label={`候補日${idx + 1}を削除`}
                  className="text-gray-400 hover:text-red-500 p-1"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
