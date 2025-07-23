'use client';

/**
 * EventCreationWizard（全品質要件考慮・国際化・ロジック分離）
 * - カスタムフックとUIを1ファイル内で定義
 * - 全テキスト・プリセット・ラベルは国際化(i18n)対応
 * - 型安全・アクセシビリティ・拡張性重視
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from './calendar-picker';
import { TimeSlotEditor } from './time-slot-editor';
import { PollTitle } from './poll-title';
import { DateTimeCandidate, TimeSlot } from '@/lib/types';
import { Calendar, Clock, Share2 } from 'lucide-react';

// --- 型定義と国際化テキスト -----------------

type Lang = 'ja' | 'en';

interface PresetTimeSlot {
  key: string;
  label: { ja: string; en: string };
  startTime: string;
  endTime: string;
}

const I18N = {
  ja: {
    eventTitleLabel: 'イベント名を入力してください',
    selectDateAndTime: '候補日と時間帯を選択してください',
    calendarHelp: 'カレンダーで日付を選択し、各日付の時間帯をボタンで追加できます',
    next: '次へ',
    setTimes: '時間帯を設定してください',
    timeHelp: '各日程の時間帯を個別に設定できます（必要に応じて編集・追加も可能）',
    complete: '作成完了',
    dateSelect: '日程選択',
    timeSet: '時間設定',
  },
  en: {
    eventTitleLabel: 'Enter event title',
    selectDateAndTime: 'Select candidate dates and time slots',
    calendarHelp: 'Select dates from the calendar and add time slots with buttons',
    next: 'Next',
    setTimes: 'Set time slots',
    timeHelp: 'You can set time slots for each date (edit/add as needed)',
    complete: 'Complete',
    dateSelect: 'Date Selection',
    timeSet: 'Time Setting',
  },
} as const;

const PRESET_TIME_SLOTS: PresetTimeSlot[] = [
  { key: 'morning', label: { ja: '午前', en: 'Morning' }, startTime: '09:00', endTime: '12:00' },
  { key: 'afternoon', label: { ja: '午後', en: 'Afternoon' }, startTime: '13:00', endTime: '17:00' },
  { key: 'night', label: { ja: '夜', en: 'Night' }, startTime: '18:00', endTime: '21:00' },
] as const;

// --- カスタムフック：ロジック分離 -----------------

function useDateTimeCandidates(
  initialCandidates: DateTimeCandidate[]
) {
  const [datesWithTimeSlots, setDatesWithTimeSlots] = useState<Record<string, TimeSlot[]>>(() =>
    Object.fromEntries(initialCandidates.map(c => [c.date, c.timeSlots]))
  );

  const selectedDates = useMemo(() => Object.keys(datesWithTimeSlots).sort(), [datesWithTimeSlots]);

  const isPresetSelected = useCallback(
    (date: string, preset: PresetTimeSlot): boolean =>
      !!datesWithTimeSlots[date]?.some(
        slot => slot.startTime === preset.startTime && slot.endTime === preset.endTime
      ),
    [datesWithTimeSlots]
  );

  const toggleDate = useCallback((date: string) => {
    setDatesWithTimeSlots(prev =>
      prev[date]
        ? Object.fromEntries(Object.entries(prev).filter(([d]) => d !== date))
        : { ...prev, [date]: [] }
    );
  }, []);

  const togglePreset = useCallback((date: string, preset: PresetTimeSlot) => {
    setDatesWithTimeSlots(prev => {
      const slots = prev[date] || [];
      return {
        ...prev,
        [date]: slots.some(
          slot => slot.startTime === preset.startTime && slot.endTime === preset.endTime
        )
          ? slots.filter(slot => !(slot.startTime === preset.startTime && slot.endTime === preset.endTime))
          : [
              ...slots,
              {
                id: `${date}-${preset.key}`,
                startTime: preset.startTime,
                endTime: preset.endTime,
                label: preset.label.ja, // デフォルトja、必要に応じて切替
              },
            ],
      };
    });
  }, []);

  const updateTimeSlots = useCallback((date: string, timeSlots: TimeSlot[]) => {
    setDatesWithTimeSlots(prev => ({ ...prev, [date]: timeSlots }));
  }, []);

  const removeDate = useCallback((date: string) => {
    setDatesWithTimeSlots(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  const toCandidatesArray = useCallback(
    () =>
      selectedDates.map(date => ({
        date,
        timeSlots: datesWithTimeSlots[date] ?? [],
      })),
    [selectedDates, datesWithTimeSlots]
  );

  return {
    datesWithTimeSlots,
    selectedDates,
    isPresetSelected,
    toggleDate,
    togglePreset,
    updateTimeSlots,
    removeDate,
    toCandidatesArray,
  };
}

// --- UI本体 -----------------

type Step = 'dates' | 'times';

interface EventCreationWizardProps {
  title: string;
  candidates: DateTimeCandidate[];
  onTitleChange: (title: string) => void;
  onCandidatesChange: (candidates: DateTimeCandidate[]) => void;
  onComplete: () => void;
  language?: Lang;
}

export const EventCreationWizard = memo(function EventCreationWizard({
  title,
  candidates,
  onTitleChange,
  onCandidatesChange,
  onComplete,
  language = 'ja',
}: EventCreationWizardProps) {
  const [step, setStep] = useState<Step>('dates');
  const {
    datesWithTimeSlots,
    selectedDates,
    isPresetSelected,
    toggleDate,
    togglePreset,
    updateTimeSlots,
    removeDate,
    toCandidatesArray,
  } = useDateTimeCandidates(candidates);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const canGoToTimes = selectedDates.some(date => (datesWithTimeSlots[date]?.length ?? 0) > 0);
  const canComplete =
    title.trim() && candidates.length > 0 && candidates.every(c => c.timeSlots.length > 0);

  const t = I18N[language];

  const steps = [
    { key: 'dates', icon: Calendar, label: t.dateSelect },
    { key: 'times', icon: Clock, label: t.timeSet },
  ] as const;

  return (
    <div className="space-y-8" aria-label="event-creation-wizard">
      {/* ステップインジケーター */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((stepObj, idx) => {
          const isActive = step === stepObj.key;
          const isClickable =
            stepObj.key === 'dates' ||
            (stepObj.key === 'times' && canGoToTimes);
          return (
            <div key={stepObj.key} className="flex items-center">
              <Button
                type="button"
                variant={isActive ? 'default' : 'outline'}
                className={`w-10 h-10 rounded-full flex items-center justify-center p-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border-gray-300'}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={stepObj.label}
                onClick={() => isClickable && setStep(stepObj.key as Step)}
                disabled={!isClickable}
              >
                <stepObj.icon className="h-5 w-5" />
              </Button>
              <span className={`ml-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {stepObj.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${step === 'times' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ステップUI */}
      {step === 'dates' && (
        <>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-center">{t.eventTitleLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <PollTitle title={title} onTitleChange={onTitleChange} />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-center">{t.selectDateAndTime}</CardTitle>
                <p className="text-center text-sm text-gray-600">
                  {t.calendarHelp}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CalendarPicker
                    selectedDates={selectedDates}
                    onDateToggle={toggleDate}
                    minDate={minDate}
                  />
                  {selectedDates.length > 0 && (
                    <div className="space-y-3">
                      {selectedDates.map(date => (
                        <div key={date} className="flex flex-col md:flex-row md:items-center md:gap-4 border rounded p-3">
                          <span className="font-medium text-sm w-28">
                            {new Date(date).toLocaleDateString(
                              language === 'en' ? 'en-US' : 'ja-JP',
                              { month: 'short', day: 'numeric', weekday: 'short' }
                            )}
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            {PRESET_TIME_SLOTS.map(preset => (
                              <Button
                                key={preset.key}
                                type="button"
                                size="sm"
                                variant={isPresetSelected(date, preset) ? 'default' : 'outline'}
                                className={isPresetSelected(date, preset) ? 'bg-blue-600 text-white' : ''}
                                onClick={() => togglePreset(date, preset)}
                              >
                                {preset.label[language]}（{preset.startTime}〜{preset.endTime}）
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-1 flex-wrap mt-2 md:mt-0">
                            {datesWithTimeSlots[date]?.map(slot => (
                              <span key={slot.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {slot.label ?? ''} {slot.startTime}〜{slot.endTime}
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
          <div className="flex justify-end pt-6 border-t border-gray-100">
            <Button
              onClick={() => {
                onCandidatesChange(toCandidatesArray());
                setStep('times');
              }}
              disabled={!canGoToTimes}
              className="px-8 bg-blue-600 hover:bg-blue-700"
              aria-disabled={!canGoToTimes}
            >
              {t.next}
            </Button>
          </div>
        </>
      )}

      {step === 'times' && (
        <>
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-center">{t.setTimes}</CardTitle>
                <p className="text-center text-sm text-gray-600">
                  {t.timeHelp}
                </p>
              </CardHeader>
            </Card>
            <div className="space-y-4">
              {candidates.map(candidate => (
                <TimeSlotEditor
                  key={candidate.date}
                  date={candidate.date}
                  timeSlots={candidate.timeSlots}
                  onTimeSlotsChange={updateTimeSlots}
                  onRemoveDate={removeDate}
                  language={language}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-gray-100">
            <Button
              onClick={onComplete}
              disabled={!canComplete}
              className="px-8 bg-blue-600 hover:bg-blue-700"
              aria-disabled={!canComplete}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t.complete}
            </Button>
          </div>
        </>
      )}
    </div>
  );
});
