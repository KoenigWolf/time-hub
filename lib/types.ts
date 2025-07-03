/** 回答は○または×のみ */
export type Answer = '○' | '×';

/** 時間帯の設定 */
export interface TimeSlot {
  id: string;        // 一意のID
  startTime: string; // "HH:mm" 形式
  endTime: string;   // "HH:mm" 形式
  label?: string;    // 表示用ラベル（例：午前、午後、夜間）
}

/** 候補日と時間帯のセット */
export interface DateTimeCandidate {
  date: string;           // "yyyy-MM-dd" 形式
  timeSlots: TimeSlot[];  // その日の時間帯候補
}

/** 回答者ユーザー */
export interface User {
  name: string;      // ユーザー名
  answers: Answer[]; // 各候補日時への回答（フラット配列）
}

/** 日程調整データ全体 */
export interface PollData {
  title: string;                    // イベント名
  candidates: DateTimeCandidate[];  // 候補日時リスト
  users: User[];                    // 回答者リスト
  
  // 後方互換性のため残す（マイグレーション用）
  dates?: string[];
}

/** 候補日ごとの参加可能人数 */
export interface DateSummary {
  available: number;
}

/** 最適な候補日時（最大参加人数の日時） */
export interface BestDateTime {
  candidateIndex: number;  // candidates 配列でのインデックス
  timeSlotIndex: number;   // timeSlots 配列でのインデックス
  available: number;       // その日時に参加できる人数
  date: string;           // 日付
  timeSlot: TimeSlot;     // 時間帯
}

/** カレンダー表示用の日付情報 */
export interface CalendarDate {
  date: string;           // "yyyy-MM-dd" 形式
  isSelected: boolean;    // 選択されているか
  isToday: boolean;       // 今日かどうか
  isCurrentMonth: boolean; // 現在表示月かどうか
}
