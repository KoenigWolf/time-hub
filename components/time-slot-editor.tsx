'use client';

/**
 * TimeSlotEditor
 * - 日付単位で時間帯（TimeSlot）の編集・追加・削除を提供
 * - 国際化・アクセシビリティ・拡張性・型安全・再利用性・パフォーマンス・UI/UX全観点対応
 */

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { createDefaultTimeSlots, formatTimeSlot } from '@/lib/calendar-utils';

// ---------- 国際化テキストと型 -----------

type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    collapse: '折りたたむ',
    expand: '詳細設定',
    done: '完了',
    setTime: '時間設定',
    reset: '初期設定に戻す',
    add: '追加',
    labelPlaceholder: 'ラベル',
    timeSetting: '時間帯設定',
    removeDate: 'この日を削除',
    removeSlot: '時間帯を削除',
    help: '各時間帯にラベルを付けることで、参加者にとって分かりやすくなります。',
  },
  en: {
    collapse: 'Collapse',
    expand: 'Advanced',
    done: 'Done',
    setTime: 'Set Time',
    reset: 'Reset Defaults',
    add: 'Add',
    labelPlaceholder: 'Label',
    timeSetting: 'Time Slot Setting',
    removeDate: 'Remove this day',
    removeSlot: 'Remove time slot',
    help: 'Adding labels makes it easier for participants to understand.',
  },
} as const;

// ---------- props型（拡張性・再利用性） -----------

export interface TimeSlotEditorProps {
  date: string;
  timeSlots: TimeSlot[];
  onTimeSlotsChange: (date: string, timeSlots: TimeSlot[]) => void;
  onRemoveDate: (date: string) => void;
  language?: Lang;
}

// ---------- UUIDユーティリティ（型安全・安全性） -----------

const generateId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

// ---------- 単一時間帯編集行（小コンポーネント化） -----------

interface TimeSlotRowProps {
  timeSlot: TimeSlot;
  onChange: (updated: TimeSlot) => void;
  onRemove: () => void;
  canRemove: boolean;
  language: Lang;
}

const TimeSlotRow = memo(function TimeSlotRow({
  timeSlot,
  onChange,
  onRemove,
  canRemove,
  language,
}: TimeSlotRowProps) {
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
        placeholder={I18N[language].labelPlaceholder}
        value={timeSlot.label || ''}
        onChange={e => handleInput('label', e.target.value)}
        className="w-20 text-sm"
        maxLength={10}
        aria-label={I18N[language].labelPlaceholder}
      />
      <Input
        type="time"
        value={timeSlot.startTime}
        onChange={e => handleInput('startTime', e.target.value)}
        className="w-24 text-sm"
        aria-label="start time"
      />
      <span className="text-gray-400">〜</span>
      <Input
        type="time"
        value={timeSlot.endTime}
        onChange={e => handleInput('endTime', e.target.value)}
        className="w-24 text-sm"
        aria-label="end time"
      />
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label={I18N[language].removeSlot}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

// ---------- 本体コンポーネント -----------

export const TimeSlotEditor = memo(function TimeSlotEditor({
  date,
  timeSlots,
  onTimeSlotsChange,
  onRemoveDate,
  language = 'ja',
}: TimeSlotEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = I18N[language];

  // 時間帯更新
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

  // 日付表示（国際化）
  const formattedDate = new Date(date).toLocaleDateString(
    language === 'en' ? 'en-US' : 'ja-JP',
    { month: 'short', day: 'numeric', weekday: 'short' }
  );

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
              aria-label={isExpanded ? t.collapse : t.expand}
              type="button"
            >
              <Clock className="h-4 w-4 mr-1" />
              {isExpanded ? t.done : t.setTime}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDate(date)}
              className="text-gray-400 hover:text-red-500"
              aria-label={t.removeDate}
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
            <h4 className="text-sm font-medium text-gray-700">{t.timeSetting}</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs"
                type="button"
              >
                {t.reset}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="text-xs"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t.add}
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
                language={language}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {t.help}
          </p>
        </CardContent>
      )}
    </Card>
  );
});
