'use client';

import { AnswerFormBase } from './answer-form-base';
import { Answer } from '@/lib/types';

// AnswerForm のprops型定義をexport（再利用性・テスト容易性向上）
export type AnswerFormProps = {
  dates: string[];
  onSubmit: (userName: string, answers: Answer[]) => void;
};

// 薄いラッパーとして、将来拡張も意識したprops受け渡し
export function AnswerForm({ dates, onSubmit }: AnswerFormProps) {
  // propsをそのまま渡すことで、将来AnswerFormBase側のAPI拡張にも対応しやすい
  return <AnswerFormBase dates={dates} onSubmit={onSubmit} />;
}
