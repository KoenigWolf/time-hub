'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from './calendar-picker';
import { TimeSlotEditor } from './time-slot-editor';
import { PollTitle } from './poll-title';
import { DateTimeCandidate, TimeSlot } from '@/lib/types';
import { createDefaultTimeSlots } from '@/lib/calendar-utils';
import { Calendar, Clock, Share2 } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState<'title' | 'dates' | 'times'>('title');

  // 選択済み日付の配列を取得
  const selectedDates = candidates.map(c => c.date);

  // 今日以降の日付のみ選択可能
  const minDate = new Date().toISOString().slice(0, 10);

  // 日付の選択/選択解除
  const handleDateToggle = useCallback((date: string) => {
    const isSelected = selectedDates.includes(date);
    
    if (isSelected) {
      // 日付を削除
      const newCandidates = candidates.filter(c => c.date !== date);
      onCandidatesChange(newCandidates);
    } else {
      // 日付を追加
      const newCandidate: DateTimeCandidate = {
        date,
        timeSlots: createDefaultTimeSlots(),
      };
      const newCandidates = [...candidates, newCandidate].sort((a, b) => a.date.localeCompare(b.date));
      onCandidatesChange(newCandidates);
    }
  }, [candidates, selectedDates, onCandidatesChange]);

  // 時間帯の変更
  const handleTimeSlotsChange = useCallback((date: string, timeSlots: TimeSlot[]) => {
    const newCandidates = candidates.map(candidate =>
      candidate.date === date ? { ...candidate, timeSlots } : candidate
    );
    onCandidatesChange(newCandidates);
  }, [candidates, onCandidatesChange]);

  // 日付の削除
  const handleRemoveDate = useCallback((date: string) => {
    const newCandidates = candidates.filter(c => c.date !== date);
    onCandidatesChange(newCandidates);
  }, [candidates, onCandidatesChange]);

  // ステップの進行
  const handleNext = useCallback(() => {
    if (currentStep === 'title' && title.trim()) {
      setCurrentStep('dates');
    } else if (currentStep === 'dates' && selectedDates.length > 0) {
      setCurrentStep('times');
    } else if (currentStep === 'times') {
      onComplete();
    }
  }, [currentStep, title, selectedDates.length, onComplete]);

  // ステップの戻る
  const handleBack = useCallback(() => {
    if (currentStep === 'times') {
      setCurrentStep('dates');
    } else if (currentStep === 'dates') {
      setCurrentStep('title');
    }
  }, [currentStep]);

  const canProceed = 
    (currentStep === 'title' && title.trim()) ||
    (currentStep === 'dates' && selectedDates.length > 0) ||
    (currentStep === 'times');

  return (
    <div className="space-y-6">
      {/* プログレスインジケーター */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { key: 'title', icon: Calendar, label: 'イベント名' },
          { key: 'dates', icon: Calendar, label: '日程選択' },
          { key: 'times', icon: Clock, label: '時間設定' },
        ].map((step, index) => {
          const isCurrent = currentStep === step.key;
          const isCompleted = 
            (step.key === 'title' && (currentStep === 'dates' || currentStep === 'times')) ||
            (step.key === 'dates' && currentStep === 'times');

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isCompleted
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {index < 2 && (
                <div
                  className={`w-8 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ステップコンテンツ */}
      {currentStep === 'title' && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">イベント名を入力してください</CardTitle>
            </CardHeader>
            <CardContent>
              <PollTitle title={title} onTitleChange={onTitleChange} />
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'dates' && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">候補日を選択してください</CardTitle>
              <p className="text-center text-sm text-gray-600">
                カレンダーの日付をクリックして複数日を選択できます
              </p>
            </CardHeader>
            <CardContent>
              <CalendarPicker
                selectedDates={selectedDates}
                onDateToggle={handleDateToggle}
                minDate={minDate}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'times' && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">時間帯を設定してください</CardTitle>
              <p className="text-center text-sm text-gray-600">
                各日程の時間帯を個別に設定できます
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
      )}

      {/* ナビゲーションボタン */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 'title'}
          className="px-6"
        >
          戻る
        </Button>

        <div className="flex items-center gap-3">
          {currentStep === 'times' && (
            <span className="text-sm text-gray-600">
              設定完了後、URLを共有できます
            </span>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 'times' ? (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                作成完了
              </>
            ) : (
              '次へ'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}); 