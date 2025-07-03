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
export const DateTimeAnswerForm = memo(function DateTimeAnswerForm({
  candidates,
  onSubmit,
}: DateTimeAnswerFormProps) {
  // 候補日時のバリデーション・再計算
  const totalTimeSlots = useMemo(() => getTotalTimeSlots(candidates), [candidates]);

  // ユーザー名
  const [userName, setUserName] = useState('');
  
  // 回答（フラット配列）
  const [answers, setAnswers] = useState<Answer[]>(() => 
    Array(totalTimeSlots).fill('×')
  );

  // 候補日時数が変われば回答もリセット
  if (answers.length !== totalTimeSlots) {
    setAnswers(Array(totalTimeSlots).fill('×'));
  }

  // 回答をトグル
  const handleToggle = useCallback((flatIndex: number) => {
    setAnswers(prev =>
      prev.map((a, i) => (i === flatIndex ? toggleAnswer(a) : a))
    );
  }, []);

  // 送信
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(userName.trim(), answers);
    setUserName('');
    setAnswers(Array(totalTimeSlots).fill('×'));
  }, [onSubmit, userName, answers, totalTimeSlots]);

  const canSubmit = userName.trim().length > 0 && totalTimeSlots > 0;

  // 候補日時がなければ何も表示しない
  if (totalTimeSlots === 0) return null;

  // フラットインデックスを正確に計算するためのヘルパー
  const getFlatIndex = (candidateIndex: number, timeSlotIndex: number): number => {
    let index = 0;
    for (let i = 0; i < candidateIndex; i++) {
      index += candidates[i].timeSlots.length;
    }
    return index + timeSlotIndex;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <label className="text-sm font-medium">あなたの回答</label>
        
        <div className="space-y-4">
          <Input
            placeholder="お名前"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
            maxLength={24}
            autoComplete="off"
          />

          <div className="space-y-4">
            {candidates.map((candidate, candidateIndex) => (
              <div key={candidate.date} className="border rounded-lg p-4 space-y-3">
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
                    const flatIndex = getFlatIndex(candidateIndex, timeSlotIndex);
                    const answer = answers[flatIndex] || '×';
                    
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
                          onClick={() => handleToggle(flatIndex)}
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
            ))}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            aria-disabled={!canSubmit}
          >
            回答を送信
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}); 