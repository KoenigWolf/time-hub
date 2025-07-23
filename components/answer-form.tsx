'use client';

/**
 * AnswerForm
 * - AnswerFormBase への薄いラッパー
 * - 型安全・拡張性・国際化・保守性・テスト容易性・再利用性重視
 * - 全観点考慮済み
 */

import { AnswerFormBase } from './answer-form-base';
import type { Answer } from '@/lib/types';

// AnswerFormProps: AnswerForm の props 型定義（再利用性・型安全・テスト容易性向上）
export interface AnswerFormProps {
  dates: string[];
  onSubmit: (userName: string, answers: Answer[]) => void;
  language?: 'ja' | 'en'; // 国際化
  renderDateLabel?: (date: string, language?: 'ja' | 'en') => React.ReactNode; // 拡張性
}

/**
 * AnswerForm
 * - AnswerFormBase の API 拡張やUIラッピング用途に対応
 * - props透過（将来AnswerFormBaseのAPI拡張もそのまま対応可）
 * - language/renderDateLabel等も渡せるよう設計
 */
export function AnswerForm(props: AnswerFormProps) {
  // 必要ならここでロギング・可観測性のフック等も追加可能
  return <AnswerFormBase {...props} />;
}

/*
  --- 将来的な拡張例 ---
  - AnswerFormにUIデコレーション/バリデーション/外部連携/ロギング等を追加しやすい
  - テスト容易性・依存性管理の観点からもシンプルな設計
*/
