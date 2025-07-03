import { CalendarDate, DateTimeCandidate, TimeSlot } from './types';

// UUID生成の代替実装（ブラウザ対応）
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック実装
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 月のカレンダーデータを生成
 */
export function generateCalendarDates(
  year: number,
  month: number,
  selectedDates: string[]
): CalendarDate[] {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // 週の最初から

  const dates: CalendarDate[] = [];
  const current = new Date(startDate);

  // 6週間分（42日）を生成
  for (let i = 0; i < 42; i++) {
    const dateStr = current.toISOString().slice(0, 10);
    dates.push({
      date: dateStr,
      isSelected: selectedDates.includes(dateStr),
      isToday: dateStr === today,
      isCurrentMonth: current.getMonth() === month,
    });
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 日付文字列をDate型に変換
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * 月の表示名を取得
 */
export function getMonthName(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * 曜日の配列を取得
 */
export function getDayNames(): string[] {
  return ['日', '月', '火', '水', '木', '金', '土'];
}

/**
 * デフォルトの時間帯テンプレートを生成
 */
export function createDefaultTimeSlots(): TimeSlot[] {
  return [
    {
      id: generateId(),
      startTime: '09:00',
      endTime: '12:00',
      label: '午前',
    },
    {
      id: generateId(),
      startTime: '13:00',
      endTime: '17:00',
      label: '午後',
    },
  ];
}

/**
 * 時間帯の表示文字列を生成
 */
export function formatTimeSlot(timeSlot: TimeSlot): string {
  if (timeSlot.label) {
    return `${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime})`;
  }
  return `${timeSlot.startTime}-${timeSlot.endTime}`;
}

/**
 * 候補日時をフラット配列に変換（回答用）
 */
export function flattenCandidates(candidates: DateTimeCandidate[]): string[] {
  const flattened: string[] = [];
  candidates.forEach((candidate, candidateIndex) => {
    candidate.timeSlots.forEach((timeSlot, timeSlotIndex) => {
      flattened.push(`${candidate.date}_${timeSlot.id}`);
    });
  });
  return flattened;
}

/**
 * フラット配列のインデックスから候補日時のインデックスに変換
 */
export function getFlattenedIndex(
  candidates: DateTimeCandidate[],
  candidateIndex: number,
  timeSlotIndex: number
): number {
  let index = 0;
  for (let i = 0; i < candidateIndex; i++) {
    index += candidates[i].timeSlots.length;
  }
  return index + timeSlotIndex;
}

/**
 * フラット配列のインデックスから候補日時のインデックスを逆算
 */
export function getOriginalIndices(
  candidates: DateTimeCandidate[],
  flatIndex: number
): { candidateIndex: number; timeSlotIndex: number } | null {
  let currentIndex = 0;
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
    const candidate = candidates[candidateIndex];
    for (let timeSlotIndex = 0; timeSlotIndex < candidate.timeSlots.length; timeSlotIndex++) {
      if (currentIndex === flatIndex) {
        return { candidateIndex, timeSlotIndex };
      }
      currentIndex++;
    }
  }
  return null;
} 