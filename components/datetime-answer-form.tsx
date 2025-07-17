'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Answer, DateTimeCandidate } from '@/lib/types';
import { toggleAnswer, getTotalTimeSlots } from '@/lib/poll-utils';
import { formatTimeSlot } from '@/lib/calendar-utils';
import { formatDate } from '@/lib/date-utils';
import { AnswerFormBase } from './answer-form-base';

interface DateTimeAnswerFormProps {
  candidates: DateTimeCandidate[];
  onSubmit: (userName: string, answers: Answer[]) => void;
}

/** 候補日時の回答行 */
const DateTimeAnswerRow = memo(function DateTimeAnswerRow({
  candidate,
  candidateIndex,
  answers,
  onToggle,
}: {
  candidate: DateTimeCandidate;
  candidateIndex: number;
  answers: Answer[];
  onToggle: (flatIndex: number) => void;
}) {
  let flatIndex = candidateIndex * candidate.timeSlots.length;
  
  // 前の候補日の時間帯数を加算してフラットインデックスを計算
  // これは簡易版、正確には外部で計算する必要がある
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-gray-900">
          {formatDate(candidate.date)}
        </h4>
        <Badge variant="outline" className="text-xs">
          {new Date(candidate.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
        </Badge>
      </div>
      
      <div className="grid gap-2">
        {candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
          const currentFlatIndex = flatIndex + timeSlotIndex;
          const answer = answers[currentFlatIndex] || '×';
          
          return (
            <div
              key={timeSlot.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
            >
              <span className="text-sm font-medium">
                {formatTimeSlot(timeSlot)}
              </span>
              <Button
                type="button"
                variant={answer === '○' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggle(currentFlatIndex)}
                aria-label={`回答を切り替え: ${formatTimeSlot(timeSlot)}`}
                className={
                  answer === '○'
                    ? 'w-12 h-8 bg-green-600 hover:bg-green-700 text-white border-green-600'
                    : 'w-12 h-8 text-gray-600 hover:bg-gray-50'
                }
              >
                {answer}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/** 日時候補回答フォーム */
export function DateTimeAnswerForm({ candidates, onSubmit }: { candidates: DateTimeCandidate[]; onSubmit: (userName: string, answers: Answer[]) => void }) {
  return <AnswerFormBase candidates={candidates} onSubmit={onSubmit} />;
} 