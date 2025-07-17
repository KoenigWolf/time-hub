'use client';

import { AnswerFormBase } from './answer-form-base';
import { Answer } from '@/lib/types';

export function AnswerForm({ dates, onSubmit }: { dates: string[]; onSubmit: (userName: string, answers: Answer[]) => void }) {
  return <AnswerFormBase dates={dates} onSubmit={onSubmit} />;
}
