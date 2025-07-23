/** 回答は○または×のみ */
export type Answer = '○' | '×';

/** 時間帯（ラベルは任意・IDは必須） */
export interface TimeSlot {
  id: string;             // Unique identifier
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  label?: string;         // Display label (e.g. "午前", "午後")
}

/** 日付ごとの時間帯候補 */
export interface DateTimeCandidate {
  date: string;           // "yyyy-MM-dd"
  timeSlots: TimeSlot[];
}

/** 回答者 */
export interface User {
  name: string;
  /** 回答はフラット配列（candidates × timeSlots の順で並ぶ） */
  answers: Answer[];
}

/** 日程調整全体データ */
export interface PollData {
  title: string;
  candidates: DateTimeCandidate[];
  users: User[];
  /** @deprecated 旧バージョン互換用 */
  dates?: string[];
}

/** 候補日単位の集計 */
export interface DateSummary {
  available: number;      // 参加可人数
}

/** 最適な日時（最大参加人数の候補） */
export interface BestDateTime {
  candidateIndex: number;
  timeSlotIndex: number;
  available: number;
  date: string;
  timeSlot: TimeSlot;
}

/** カレンダー表示用の日付状態 */
export interface CalendarDate {
  date: string;           // "yyyy-MM-dd"
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

/** 最適な候補日（日付のみの集計） */
export interface BestDate {
  index: number;
  available: number;
}
