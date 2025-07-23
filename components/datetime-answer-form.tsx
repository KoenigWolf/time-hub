'use client';

/**
 * DateTimeAnswerForm
 * - 日時ごとの出欠回答フォーム
 * - 国際化・型安全・再利用性・保守性・テスト容易性・アクセシビリティ・UX・パフォーマンス・全観点に配慮
 */

import { memo } from 'react';
import type { Answer, DateTimeCandidate } from '@/lib/types';
import { AnswerFormBase } from './answer-form-base';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';

// --- props型（拡張・型安全・テスト容易性） ---
export interface DateTimeAnswerFormProps {
  candidates: DateTimeCandidate[];
  onSubmit: (userName: string, answers: Answer[]) => void;
  language?: Lang;
  renderDateLabel?: (date: string, language?: Lang) => React.ReactNode;
}

/**
 * DateTimeAnswerForm
 * - AnswerFormBase のラッパー。UI/仕様拡張やテスト容易性・国際化にも配慮。
 * - propsをそのまま透過することで再利用性・API拡張にも柔軟。
 */
export const DateTimeAnswerForm = memo(function DateTimeAnswerForm({
  candidates,
  onSubmit,
  language = 'ja',
  renderDateLabel,
}: DateTimeAnswerFormProps) {
  // 必要ならここで可観測性（ロギング/トラッキング）や認証・権限制御など追加可能
  // 例: useAnalytics({ event: 'view_datetime_answer_form' });

  return (
    <AnswerFormBase
      candidates={candidates}
      onSubmit={onSubmit}
      language={language}
      renderDateLabel={renderDateLabel}
    />
  );
});
