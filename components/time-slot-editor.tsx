'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { createDefaultTimeSlots, formatTimeSlot } from '@/lib/calendar-utils';

// UUID生成の代替実装（ブラウザ対応）
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック実装
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface TimeSlotEditorProps {
  date: string;
  timeSlots: TimeSlot[];
  onTimeSlotsChange: (date: string, timeSlots: TimeSlot[]) => void;
  onRemoveDate: (date: string) => void;
}

/** 個別の時間帯編集行 */
const TimeSlotRow = memo(function TimeSlotRow({
  timeSlot,
  onUpdate,
  onRemove,
  canRemove,
}: {
  timeSlot: TimeSlot;
  onUpdate: (timeSlot: TimeSlot) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const handleChange = useCallback((field: keyof TimeSlot, value: string) => {
    onUpdate({ ...timeSlot, [field]: value });
  }, [timeSlot, onUpdate]);

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <Input
        placeholder="ラベル"
        value={timeSlot.label || ''}
        onChange={e => handleChange('label', e.target.value)}
        className="w-20 text-sm"
        maxLength={10}
      />
      <Input
        type="time"
        value={timeSlot.startTime}
        onChange={e => handleChange('startTime', e.target.value)}
        className="w-24 text-sm"
      />
      <span className="text-gray-400">〜</span>
      <Input
        type="time"
        value={timeSlot.endTime}
        onChange={e => handleChange('endTime', e.target.value)}
        className="w-24 text-sm"
      />
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label="時間帯を削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

/** 時間帯エディター本体 */
export const TimeSlotEditor = memo(function TimeSlotEditor({
  date,
  timeSlots,
  onTimeSlotsChange,
  onRemoveDate,
}: TimeSlotEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTimeSlotUpdate = useCallback((index: number, updatedTimeSlot: TimeSlot) => {
    const newTimeSlots = timeSlots.slice();
    newTimeSlots[index] = updatedTimeSlot;
    onTimeSlotsChange(date, newTimeSlots);
  }, [date, timeSlots, onTimeSlotsChange]);

  const handleTimeSlotRemove = useCallback((index: number) => {
    if (timeSlots.length > 1) {
      const newTimeSlots = timeSlots.filter((_, i) => i !== index);
      onTimeSlotsChange(date, newTimeSlots);
    }
  }, [date, timeSlots, onTimeSlotsChange]);

  const handleAddTimeSlot = useCallback(() => {
    const newTimeSlot: TimeSlot = {
      id: generateId(),
      startTime: '09:00',
      endTime: '17:00',
      label: '',
    };
    onTimeSlotsChange(date, [...timeSlots, newTimeSlot]);
  }, [date, timeSlots, onTimeSlotsChange]);

  const handleUseDefaults = useCallback(() => {
    onTimeSlotsChange(date, createDefaultTimeSlots());
  }, [date, onTimeSlotsChange]);

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
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? '折りたたむ' : '詳細設定'}
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
                onClick={handleUseDefaults}
                className="text-xs"
              >
                初期設定に戻す
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTimeSlot}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {timeSlots.map((timeSlot, index) => (
              <TimeSlotRow
                key={timeSlot.id}
                timeSlot={timeSlot}
                onUpdate={slot => handleTimeSlotUpdate(index, slot)}
                onRemove={() => handleTimeSlotRemove(index)}
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