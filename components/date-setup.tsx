'use client';

import { memo, VFC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

// props型をexportして型・テスト容易性・再利用性UP
export interface DateSetupProps {
  dates: string[];
  onDateChange: (index: number, date: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
}

// 候補日入力行（小コンポーネント化で可読性・複雑度低減・テストしやすく）
const DateInputRow: VFC<{
  date: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  removable: boolean;
}> = memo(function DateInputRow({ date, index, onChange, onRemove, removable }) {
  return (
    <li className="flex items-center gap-3">
      <Input
        type="date"
        value={date}
        onChange={e => onChange(index, e.target.value)}
        className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
        aria-label={`候補日${index + 1}`}
        max="2100-01-01"
      />
      {removable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          aria-label={`候補日${index + 1}を削除`}
          className="text-gray-400 hover:text-red-500 p-1"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
});

// 日程候補入力用メインコンポーネント
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
            <DateInputRow
              key={idx}
              date={date}
              index={idx}
              onChange={onDateChange}
              onRemove={onRemoveDate}
              removable={dates.length > 1}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
