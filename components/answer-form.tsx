'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Answer } from '@/lib/types';
import { toggleAnswer } from '@/lib/poll-utils';
import { formatDate } from '@/lib/date-utils';

interface AnswerFormProps {
  dates: string[];
  onSubmit: (userName: string, answers: Answer[]) => void;
}

// 後方互換性のためのヘルパー関数
const getValidDates = (dates: string[]): string[] =>
  dates.filter(d => !!d.trim());

export function AnswerForm({ dates, onSubmit }: AnswerFormProps) {
  // 候補日のバリデーション・再計算
  const validDates = useMemo(() => getValidDates(dates), [dates]);
  const answerCount = validDates.length;

  // ユーザー名
  const [userName, setUserName] = useState('');
  // 回答
  const [answers, setAnswers] = useState<Answer[]>(
    () => Array(answerCount).fill('×')
  );

  // 候補日数が変われば回答もリセット
  // answers自体は毎回useEffectでリセットしなくても初期値で十分
  if (answers.length !== answerCount) {
    setAnswers(Array(answerCount).fill('×'));
  }

  // 回答をトグル
  const handleToggle = useCallback(
    (idx: number) => {
      setAnswers(prev =>
        prev.map((a, i) => (i === idx ? toggleAnswer(a) : a))
      );
    },
    []
  );

  // 送信
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(userName.trim(), answers);
    setUserName('');
    setAnswers(Array(answerCount).fill('×'));
  // eslint-disable-next-line
  }, [onSubmit, userName, answers, answerCount]);

  const canSubmit =
    userName.trim().length > 0 && answerCount > 0;

  // 候補日がなければ何も表示しない
  if (answerCount === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <label className="text-sm font-medium">あなたの回答</label>
        <div className="space-y-3">
          <Input
            placeholder="お名前"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400"
            maxLength={24}
            autoComplete="off"
          />
          <div className="grid gap-3">
            {validDates.map((date, i) => (
              <div
                key={date}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{formatDate(date)}</span>
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
