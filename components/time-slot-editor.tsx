'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { createDefaultTimeSlots, formatTimeSlot } from '@/lib/calendar-utils';

// UUID生成（最新のEdge/Node/Chrome環境はcrypto.randomUUIDでOK、後方互換も考慮）
const generateId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

// props型exportで型安全・再利用性向上
export interface TimeSlotEditorProps {
  date: string;
  timeSlots: TimeSlot[];
  onTimeSlotsChange: (date: string, timeSlots: TimeSlot[]) => void;
  onRemoveDate: (date: string) => void;
}

// 単一時間帯編集行を小コンポーネント化
const TimeSlotRow = memo(function TimeSlotRow({
  timeSlot,
  onChange,
  onRemove,
  canRemove,
}: {
  timeSlot: TimeSlot;
  onChange: (updated: TimeSlot) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  // 入力変化ハンドラ
  const handleInput = useCallback(
    (field: keyof TimeSlot, value: string) => {
      onChange({ ...timeSlot, [field]: value });
    },
    [timeSlot, onChange]
  );

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <Input
        placeholder="ラベル"
        value={timeSlot.label || ''}
        onChange={e => handleInput('label', e.target.value)}
        className="w-20 text-sm"
        maxLength={10}
      />
      <Input
        type="time"
        value={timeSlot.startTime}
        onChange={e => handleInput('startTime', e.target.value)}
        className="w-24 text-sm"
      />
      <span className="text-gray-400">〜</span>
      <Input
        type="time"
        value={timeSlot.endTime}
        onChange={e => handleInput('endTime', e.target.value)}
        className="w-24 text-sm"
      />
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label="時間帯を削除"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

// 時間帯エディター本体
export const TimeSlotEditor = memo(function TimeSlotEditor({
  date,
  timeSlots,
  onTimeSlotsChange,
  onRemoveDate,
}: TimeSlotEditorProps) {
  // 詳細設定の開閉状態
  const [isExpanded, setIsExpanded] = useState(false);

  // 各時間帯更新
  const handleUpdate = useCallback(
    (idx: number, updated: TimeSlot) => {
      const slots = [...timeSlots];
      slots[idx] = updated;
      onTimeSlotsChange(date, slots);
    },
    [date, timeSlots, onTimeSlotsChange]
  );

  // 時間帯削除
  const handleRemove = useCallback(
    (idx: number) => {
      if (timeSlots.length <= 1) return;
      onTimeSlotsChange(date, timeSlots.filter((_, i) => i !== idx));
    },
    [date, timeSlots, onTimeSlotsChange]
  );

  // 時間帯追加
  const handleAdd = useCallback(() => {
    onTimeSlotsChange(date, [
      ...timeSlots,
      {
        id: generateId(),
        startTime: '09:00',
        endTime: '17:00',
        label: '',
      },
    ]);
  }, [date, timeSlots, onTimeSlotsChange]);

  // デフォルト時間帯にリセット
  const handleResetDefaults = useCallback(() => {
    onTimeSlotsChange(date, createDefaultTimeSlots());
  }, [date, onTimeSlotsChange]);

  // 日付表示
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{formattedDate}</CardTitle>
            <div className="flex flex-wrap gap-1">
              {timeSlots.map(slot => (
                <Badge
                  key={slot.id}
                  variant="outline"
                  className="text-xs bg-blue-50 border-blue-200"
                >
                  {formatTimeSlot(slot)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(v => !v)}
              aria-label={isExpanded ? '折りたたむ' : '詳細設定'}
              type="button"
            >
              <Clock className="h-4 w-4 mr-1" />
              {isExpanded ? '完了' : '時間設定'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDate(date)}
              className="text-gray-400 hover:text-red-500"
              aria-label="この日を削除"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">時間帯設定</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs"
                type="button"
              >
                初期設定に戻す
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="text-xs"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {timeSlots.map((timeSlot, i) => (
              <TimeSlotRow
                key={timeSlot.id}
                timeSlot={timeSlot}
                onChange={updated => handleUpdate(i, updated)}
                onRemove={() => handleRemove(i)}
                canRemove={timeSlots.length > 1}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            各時間帯にラベルを付けることで、参加者にとって分かりやすくなります。
          </p>
        </CardContent>
      )}
    </Card>
  );
});
