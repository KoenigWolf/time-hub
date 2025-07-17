'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from './calendar-picker';
import { TimeSlotEditor } from './time-slot-editor';
import { PollTitle } from './poll-title';
import { DateTimeCandidate, TimeSlot } from '@/lib/types';
import { createDefaultTimeSlots, formatTimeSlot } from '@/lib/calendar-utils';
import { Calendar, Clock, Share2 } from 'lucide-react';

// プリセット時間帯
const PRESET_TIME_SLOTS: { label: string; startTime: string; endTime: string }[] = [
  { label: '午前', startTime: '09:00', endTime: '12:00' },
  { label: '午後', startTime: '13:00', endTime: '17:00' },
  { label: '夜', startTime: '18:00', endTime: '21:00' },
];

interface EventCreationWizardProps {
  title: string;
  candidates: DateTimeCandidate[];
  onTitleChange: (title: string) => void;
  onCandidatesChange: (candidates: DateTimeCandidate[]) => void;
  onComplete: () => void;
}

/** イベント作成ウィザード */
export const EventCreationWizard = memo(function EventCreationWizard({
  title,
  candidates,
  onTitleChange,
  onCandidatesChange,
  onComplete,
}: EventCreationWizardProps) {
  // ステップ管理: 'dates' or 'times'
  const [step, setStep] = useState<'dates' | 'times'>('dates');

  // 日付＋時間帯選択用ローカルstate
  const [selectedDatesWithTimeSlots, setSelectedDatesWithTimeSlots] = useState<{
    [date: string]: TimeSlot[];
  }>(() => {
    const initial: { [date: string]: TimeSlot[] } = {};
    candidates.forEach(c => {
      initial[c.date] = c.timeSlots;
    });
    return initial;
  });

  // 今日以降の日付のみ選択可能
  const minDate = new Date().toISOString().slice(0, 10);

  // 日付の選択/選択解除（ローカルstateのみ）
  const handleDateToggle = useCallback((date: string) => {
    setSelectedDatesWithTimeSlots(prev => {
      const next = { ...prev };
      if (next[date]) {
        delete next[date];
      } else {
        next[date] = [];
      }
      return next;
    });
  }, []);

  // 時間帯プリセット追加
  const handleAddPresetTimeSlot = useCallback((date: string, preset: typeof PRESET_TIME_SLOTS[0]) => {
    setSelectedDatesWithTimeSlots(prev => {
      const next = { ...prev };
      const exists = next[date]?.some(
        slot => slot.startTime === preset.startTime && slot.endTime === preset.endTime
      );
      if (!exists) {
        const newSlot: TimeSlot = {
          id: `${date}-${preset.label}`,
          startTime: preset.startTime,
          endTime: preset.endTime,
          label: preset.label,
        };
        next[date] = [...(next[date] || []), newSlot];
      }
      return next;
    });
  }, []);

  // 時間帯プリセット削除
  const handleRemovePresetTimeSlot = useCallback((date: string, preset: typeof PRESET_TIME_SLOTS[0]) => {
    setSelectedDatesWithTimeSlots(prev => {
      const next = { ...prev };
      next[date] = (next[date] || []).filter(
        slot => !(slot.startTime === preset.startTime && slot.endTime === preset.endTime)
      );
      return next;
    });
  }, []);

  // 「次へ」ボタンでcandidatesに反映し、stepを進める
  const handleNext = useCallback(() => {
    // candidatesをローカル日付＋時間帯で上書き
    const newCandidates = Object.entries(selectedDatesWithTimeSlots)
      .filter(([date, slots]) => slots.length > 0)
      .map(([date, slots]) => ({ date, timeSlots: slots }));
    onCandidatesChange(newCandidates);
    setStep('times');
  }, [selectedDatesWithTimeSlots, onCandidatesChange]);

  // 時間帯の変更（詳細エディタ用）
  const handleTimeSlotsChange = useCallback((date: string, timeSlots: TimeSlot[]) => {
    setSelectedDatesWithTimeSlots(prev => ({ ...prev, [date]: timeSlots }));
    // onCandidatesChangeは「次へ」時のみ呼ぶ
  }, []);

  // 日付の削除（時間帯設定画面用）
  const handleRemoveDate = useCallback((date: string) => {
    setSelectedDatesWithTimeSlots(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
    // onCandidatesChangeは「次へ」時のみ呼ぶ
  }, []);

  // 完了ボタンの活性条件
  const canComplete = title.trim() && candidates.length > 0 && candidates.every(c => c.timeSlots.length > 0);

  // ステップ遷移のバリデーション
  const canGoToTimes = Object.values(selectedDatesWithTimeSlots).some(slots => slots.length > 0);

  // 選択中日付リスト
  const selectedDates = Object.keys(selectedDatesWithTimeSlots);

  return (
    <div className="space-y-8">
      {/* ステップインジケーター（クリックで遷移可能なナビゲーション） */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { key: 'dates', icon: Calendar, label: '日程選択' },
          { key: 'times', icon: Clock, label: '時間設定' },
        ].map((stepObj, index) => {
          const isActive = step === stepObj.key;
          const isClickable =
            (stepObj.key === 'dates') ||
            (stepObj.key === 'times' && canGoToTimes);
          return (
            <div key={stepObj.key} className="flex items-center">
              <Button
                type="button"
                variant={isActive ? 'default' : 'outline'}
                className={`w-10 h-10 rounded-full flex items-center justify-center p-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border-gray-300'}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={stepObj.label}
                onClick={() => isClickable && setStep(stepObj.key as 'dates' | 'times')}
                disabled={!isClickable}
              >
                <stepObj.icon className="h-5 w-5" />
              </Button>
              <span
                className={`ml-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {stepObj.label}
              </span>
              {index < 1 && (
                <div
                  className={`w-8 h-0.5 mx-4 ${step === 'times' ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ステップごとのUI */}
      {step === 'dates' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* イベント名入力 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">イベント名を入力してください</CardTitle>
            </CardHeader>
            <CardContent>
              <PollTitle title={title} onTitleChange={onTitleChange} />
            </CardContent>
          </Card>

          {/* 候補日＋時間帯選択 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">候補日と時間帯を選択してください</CardTitle>
              <p className="text-center text-sm text-gray-600">
                カレンダーで日付を選択し、各日付の時間帯をボタンで追加できます
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CalendarPicker
                  selectedDates={selectedDates}
                  onDateToggle={handleDateToggle}
                  minDate={minDate}
                />
                {/* 日付ごとの時間帯プリセットUI */}
                {selectedDates.length > 0 && (
                  <div className="space-y-3">
                    {selectedDates.map(date => (
                      <div key={date} className="flex flex-col md:flex-row md:items-center md:gap-4 border rounded p-3">
                        <span className="font-medium text-sm w-28">
                          {new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_TIME_SLOTS.map(preset => {
                            const isSelected = selectedDatesWithTimeSlots[date]?.some(
                              slot => slot.startTime === preset.startTime && slot.endTime === preset.endTime
                            );
                            return (
                              <Button
                                key={preset.label}
                                type="button"
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                className={isSelected ? 'bg-blue-600 text-white' : ''}
                                onClick={() =>
                                  isSelected
                                    ? handleRemovePresetTimeSlot(date, preset)
                                    : handleAddPresetTimeSlot(date, preset)
                                }
                              >
                                {preset.label}（{preset.startTime}〜{preset.endTime}）
                              </Button>
                            );
                          })}
                        </div>
                        {/* 選択済み時間帯バッジ */}
                        <div className="flex gap-1 flex-wrap mt-2 md:mt-0">
                          {selectedDatesWithTimeSlots[date]?.map(slot => (
                            <span key={slot.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {slot.label} {slot.startTime}〜{slot.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'dates' && (
        <div className="flex justify-end pt-6 border-t border-gray-100">
          <Button
            onClick={handleNext}
            disabled={Object.values(selectedDatesWithTimeSlots).every(slots => slots.length === 0)}
            className="px-8 bg-blue-600 hover:bg-blue-700"
            aria-disabled={Object.values(selectedDatesWithTimeSlots).every(slots => slots.length === 0)}
          >
            次へ
          </Button>
        </div>
      )}

      {step === 'times' && (
        <>
          {/* 時間帯設定（候補日ごと） */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-center">時間帯を設定してください</CardTitle>
                <p className="text-center text-sm text-gray-600">
                  各日程の時間帯を個別に設定できます（必要に応じて編集・追加も可能）
                </p>
              </CardHeader>
            </Card>
            <div className="space-y-4">
              {candidates.map(candidate => (
                <TimeSlotEditor
                  key={candidate.date}
                  date={candidate.date}
                  timeSlots={candidate.timeSlots}
                  onTimeSlotsChange={handleTimeSlotsChange}
                  onRemoveDate={handleRemoveDate}
                />
              ))}
            </div>
          </div>

          {/* 完了ボタン */}
          <div className="flex justify-end pt-6 border-t border-gray-100">
            <Button
              onClick={onComplete}
              disabled={!canComplete}
              className="px-8 bg-blue-600 hover:bg-blue-700"
              aria-disabled={!canComplete}
            >
              <Share2 className="h-4 w-4 mr-2" />
              作成完了
            </Button>
          </div>
        </>
      )}
    </div>
  );
}); 