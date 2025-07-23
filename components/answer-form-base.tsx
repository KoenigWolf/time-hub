'use client';

/**
 * AnswerFormBase（全観点最適化・国際化対応・エラー解消版）
 * - 日付単位 or 日付＋時間帯単位の出欠回答フォーム
 * - 型安全/国際化/再利用/アクセシビリティ/パフォーマンス/拡張性/冗長性削減を徹底
 */

import { useState, useMemo, useCallback, ReactNode, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Answer, DateTimeCandidate, TimeSlot } from '@/lib/types';
import { toggleAnswer, getTotalTimeSlots } from '@/lib/poll-utils';

// ---- 国際化定義 ----

type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    yourAnswer: 'あなたの回答',
    namePlaceholder: 'お名前',
    send: '回答を送信',
    label: 'ラベル',
    requiredName: 'お名前を入力してください',
    switch: (label: string) => `回答を切り替え: ${label}`,
    shortWeekday: (date: string) =>
      new Date(date).toLocaleDateString('ja-JP', { weekday: 'short' }),
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    formatTimeSlot: (slot: TimeSlot) =>
      `${slot.label ? slot.label + ' ' : ''}${slot.startTime}〜${slot.endTime}`,
  },
  en: {
    yourAnswer: 'Your Answer',
    namePlaceholder: 'Name',
    send: 'Submit',
    label: 'Label',
    requiredName: 'Please enter your name',
    switch: (label: string) => `Toggle answer: ${label}`,
    shortWeekday: (date: string) =>
      new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    formatTimeSlot: (slot: TimeSlot) =>
      `${slot.label ? slot.label + ' ' : ''}${slot.startTime}~${slot.endTime}`,
  },
} as const;

// ---- props型定義 ----

export type AnswerFormBaseProps =
  | {
      dates: string[];
      candidates?: undefined;
      onSubmit: (userName: string, answers: Answer[]) => void;
      renderDateLabel?: (date: string, language?: Lang) => ReactNode;
      language?: Lang;
    }
  | {
      dates?: undefined;
      candidates: DateTimeCandidate[];
      onSubmit: (userName: string, answers: Answer[]) => void;
      renderDateLabel?: (date: string, language?: Lang) => ReactNode;
      language?: Lang;
    };

// ---- 小コンポーネント ----

const DateTimeRow = memo(function DateTimeRow({
  candidate,
  candidateIndex,
  flatIndexBase,
  answers,
  onToggle,
  renderDateLabel,
  language,
}: {
  candidate: DateTimeCandidate;
  candidateIndex: number;
  flatIndexBase: number;
  answers: Answer[];
  onToggle: (flatIndex: number) => void;
  renderDateLabel?: (date: string, language?: Lang) => ReactNode;
  language: Lang;
}) {
  const t = I18N[language];
  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid="datetime-row">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-gray-900">
          {renderDateLabel
            ? renderDateLabel(candidate.date, language)
            : t.formatDate(candidate.date)}
        </h4>
        <Badge variant="outline" className="text-xs">
          {t.shortWeekday(candidate.date)}
        </Badge>
      </div>
      <div className="grid gap-2">
        {candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
          const flatIndex = flatIndexBase + timeSlotIndex;
          const answer = answers[flatIndex] || '×';
          return (
            <div
              key={timeSlot.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              data-testid="timeslot-row"
            >
              <span className="text-sm font-medium">{t.formatTimeSlot(timeSlot)}</span>
              <Button
                type="button"
                variant={answer === '○' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggle(flatIndex)}
                aria-label={t.switch(t.formatTimeSlot(timeSlot))}
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

const DateRow = memo(function DateRow({
  date,
  index,
  answer,
  onToggle,
  renderDateLabel,
  language,
}: {
  date: string;
  index: number;
  answer: Answer;
  onToggle: (index: number) => void;
  renderDateLabel?: (date: string, language?: Lang) => ReactNode;
  language: Lang;
}) {
  const t = I18N[language];
  return (
    <div key={date} className="flex items-center justify-between py-2" data-testid="date-row">
      <span className="text-sm">
        {renderDateLabel
          ? renderDateLabel(date, language)
          : t.formatDate(date)}
      </span>
      <Button
        type="button"
        variant={answer === '○' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggle(index)}
        aria-label={t.switch(t.formatDate(date))}
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
});

// ---- 本体 ----

export function AnswerFormBase(props: AnswerFormBaseProps) {
  const language: Lang = props.language ?? 'ja';
  const t = I18N[language];

  // 回答パターン分岐
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

  if (totalCount === 0) return null;

  return (
    <Card className="border-0 shadow-sm" aria-label="answer-form">
      <CardContent className="p-6 space-y-4">
        <label className="text-sm font-medium" htmlFor="user-name">
          {t.yourAnswer}
        </label>
        <div className="space-y-4">
          <Input
            id="user-name"
            placeholder={t.namePlaceholder}
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
            maxLength={24}
            autoComplete="off"
            aria-label={t.namePlaceholder}
            required
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
                    language={language}
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
                  language={language}
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
            {t.send}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
