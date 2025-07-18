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

// 共通回答フォームのprops型
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

// 日付＋時間帯回答行（小コンポーネント化で複雑度・可読性改善）
function DateTimeRow({
  candidate,
  candidateIndex,
  flatIndexBase,
  answers,
  onToggle,
  renderDateLabel,
}: {
  candidate: DateTimeCandidate;
  candidateIndex: number;
  flatIndexBase: number;
  answers: Answer[];
  onToggle: (flatIndex: number) => void;
  renderDateLabel?: (date: string) => ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-gray-900">
          {renderDateLabel ? renderDateLabel(candidate.date) : formatDate(candidate.date)}
        </h4>
        <Badge variant="outline" className="text-xs">
          {new Date(candidate.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
        </Badge>
      </div>
      <div className="grid gap-2">
        {candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
          const flatIndex = flatIndexBase + timeSlotIndex;
          const answer = answers[flatIndex] || '×';
          return (
            <div key={timeSlot.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">{formatTimeSlot(timeSlot)}</span>
              <Button
                type="button"
                variant={answer === '○' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggle(flatIndex)}
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
}

// 日付のみ回答行
function DateRow({
  date,
  index,
  answer,
  onToggle,
  renderDateLabel,
}: {
  date: string;
  index: number;
  answer: Answer;
  onToggle: (index: number) => void;
  renderDateLabel?: (date: string) => ReactNode;
}) {
  return (
    <div key={date} className="flex items-center justify-between py-2">
      <span className="text-sm">
        {renderDateLabel ? renderDateLabel(date) : formatDate(date)}
      </span>
      <Button
        type="button"
        variant={answer === '○' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggle(index)}
        aria-label={`回答を切り替え: ${formatDate(date)}`}
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
}

// 回答フォーム本体
export function AnswerFormBase(props: AnswerFormBaseProps) {
  // 日付＋時間帯パターンかどうか
  const isDateTime = !!props.candidates;

  // 回答対象数
  const totalCount = useMemo(() => {
    if (isDateTime && props.candidates) return getTotalTimeSlots(props.candidates);
    if (props.dates) return props.dates.filter(Boolean).length;
    return 0;
  }, [isDateTime, props.candidates, props.dates]);

  // ユーザー名
  const [userName, setUserName] = useState('');
  // 回答配列
  const [answers, setAnswers] = useState<Answer[]>(() => Array(totalCount).fill('×'));

  // 回答数が変化したとき自動リセット
  useMemo(() => {
    if (answers.length !== totalCount) setAnswers(Array(totalCount).fill('×'));
    // eslint-disable-next-line
  }, [totalCount]);

  // 回答トグル
  const handleToggle = useCallback((idx: number) => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? toggleAnswer(a) : a)));
  }, []);

  // 送信ボタン有効判定
  const canSubmit = userName.trim().length > 0 && totalCount > 0;

  // 送信処理
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    props.onSubmit(userName.trim(), answers);
    setUserName('');
    setAnswers(Array(totalCount).fill('×'));
  }, [props, userName, answers, totalCount, canSubmit]);

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
          {/* 回答リスト */}
          {isDateTime && props.candidates ? (
            <div className="space-y-4">
              {props.candidates.reduce<ReactNode[]>((acc, candidate, candidateIndex) => {
                const flatIndexBase = props.candidates!
                  .slice(0, candidateIndex)
                  .reduce((sum, c) => sum + c.timeSlots.length, 0);
                acc.push(
                  <DateTimeRow
                    key={candidate.date}
                    candidate={candidate}
                    candidateIndex={candidateIndex}
                    flatIndexBase={flatIndexBase}
                    answers={answers}
                    onToggle={handleToggle}
                    renderDateLabel={props.renderDateLabel}
                  />
                );
                return acc;
              }, [])}
            </div>
          ) : props.dates ? (
            <div className="grid gap-3">
              {props.dates.filter(Boolean).map((date, i) => (
                <DateRow
                  key={date}
                  date={date}
                  index={i}
                  answer={answers[i]}
                  onToggle={handleToggle}
                  renderDateLabel={props.renderDateLabel}
                />
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
