'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Answer, DateTimeCandidate, TimeSlot } from '@/lib/types';
import { toggleAnswer, getTotalTimeSlots } from '@/lib/poll-utils';
import { formatDate } from '@/lib/date-utils';
import { formatTimeSlot } from '@/lib/calendar-utils';

/**
 * 共通回答フォームのprops
 * - dates: string[]（日付のみ）
 * - candidates: DateTimeCandidate[]（日付＋時間帯）
 * どちらか一方のみ指定
 */
export type AnswerFormBaseProps =
  | {
      dates: string[];
      candidates?: undefined;
      onSubmit: (userName: string, answers: Answer[]) => void;
      renderDateLabel?: (date: string) => ReactNode;
    }
  | {
      dates?: undefined;
      candidates: DateTimeCandidate[];
      onSubmit: (userName: string, answers: Answer[]) => void;
      renderDateLabel?: (date: string) => ReactNode;
    };

/**
 * 日付のみ・日付＋時間帯の両方に対応した共通回答フォーム
 * - 型安全性・アクセシビリティ・詳細コメント重視
 * - UIも柔軟に切り替え可能
 */
export function AnswerFormBase(props: AnswerFormBaseProps) {
  // 日付のみ or 日付＋時間帯かを判定
  const isDateTime = !!props.candidates;

  // 回答数・ラベル・インデックス計算
  const totalCount = useMemo(() => {
    if (isDateTime && props.candidates) {
      return getTotalTimeSlots(props.candidates);
    } else if (props.dates) {
      return props.dates.filter(d => !!d.trim()).length;
    }
    return 0;
  }, [isDateTime, props.candidates, props.dates]);

  // ユーザー名
  const [userName, setUserName] = useState('');
  // 回答配列
  const [answers, setAnswers] = useState<Answer[]>(() => Array(totalCount).fill('×'));

  // 回答数が変わればリセット
  if (answers.length !== totalCount) {
    setAnswers(Array(totalCount).fill('×'));
  }

  // 回答トグル
  const handleToggle = useCallback((idx: number) => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? toggleAnswer(a) : a)));
  }, []);

  // 送信
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    props.onSubmit(userName.trim(), answers);
    setUserName('');
    setAnswers(Array(totalCount).fill('×'));
  }, [props, userName, answers, totalCount]);

  const canSubmit = userName.trim().length > 0 && totalCount > 0;

  // 回答がなければ何も表示しない
  if (totalCount === 0) return null;

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
            aria-label="お名前を入力"
          />

          {/* 日付＋時間帯 or 日付のみでUI切り替え */}
          {isDateTime && props.candidates ? (
            <div className="space-y-4">
              {props.candidates.map((candidate, candidateIndex) => (
                <div key={candidate.date} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      {props.renderDateLabel
                        ? props.renderDateLabel(candidate.date)
                        : formatDate(candidate.date)}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {new Date(candidate.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
                      // フラットインデックス計算
                      let flatIndex = 0;
                      for (let i = 0; i < candidateIndex; i++) {
                        flatIndex += props.candidates![i].timeSlots.length;
                      }
                      flatIndex += timeSlotIndex;
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
          ) : props.dates ? (
            <div className="grid gap-3">
              {props.dates.filter(d => !!d.trim()).map((date, i) => (
                <div
                  key={date}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm">
                    {props.renderDateLabel ? props.renderDateLabel(date) : formatDate(date)}
                  </span>
                  <Button
                    type="button"
                    variant={answers[i] === '○' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggle(i)}
                    aria-label={`回答を切り替え: ${formatDate(date)}`}
                    className={
                      answers[i] === '○'
                        ? 'w-12 h-8 bg-green-600 hover:bg-green-700 text-white border-green-600'
                        : 'w-12 h-8 text-gray-600 hover:bg-gray-50'
                    }
                  >
                    {answers[i]}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

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
} 