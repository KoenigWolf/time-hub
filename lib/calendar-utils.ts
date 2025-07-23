// calendar-utils.ts
import { CalendarDate, DateTimeCandidate, TimeSlot } from './types';

/**
 * UUID生成（ブラウザ/Node両対応、安全・一意性重視）
 * - 外部依存なし
 * - 将来的に依存注入も可能な設計
 */
export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback: 高速・十分な衝突回避
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    // eslint-disable-next-line no-mixed-operators
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * カレンダーの日付配列を生成
 * - i18n対応: 曜日表示やロケール切替も拡張可能
 * - 選択済み・今日・今月判定付き
 */
export function generateCalendarDates(
  year: number,
  month: number,
  selectedDates: string[]
): CalendarDate[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(year, month, 1);
  // 日曜始まり（日本ロケール）
  const weekStart = new Date(firstDay);
  weekStart.setDate(firstDay.getDate() - firstDay.getDay());

  const dates: CalendarDate[] = [];
  const d = new Date(weekStart);

  for (let i = 0; i < 42; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    dates.push({
      date: dateStr,
      isSelected: selectedDates.includes(dateStr),
      isToday: dateStr === todayStr,
      isCurrentMonth: d.getMonth() === month,
    });
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * "yyyy-MM-dd"→Dateオブジェクト化
 * - 形式異常時はInvalid Date返す
 */
export function parseDate(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(NaN);
  return new Date(`${dateStr}T00:00:00`);
}

/**
 * 月表示名
 * - i18n: ロケール/書式の引数化で他言語対応しやすい
 */
export function getMonthName(
  year: number,
  month: number,
  locale = 'ja-JP',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' }
): string {
  return new Date(year, month, 1).toLocaleDateString(locale, options);
}

/**
 * 曜日名リスト
 * - 拡張しやすく（en-USなど多言語配列も可）
 */
export function getDayNames(locale = 'ja-JP'): string[] {
  // 拡張例: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format
  return locale === 'ja-JP'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * デフォルト時間帯テンプレート
 * - 国際化やプリセット増減の拡張も容易
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
 * 時間帯表示フォーマット
 * - i18nを意識した構成（labelなければ時刻のみ）
 */
export function formatTimeSlot(timeSlot: TimeSlot): string {
  // 型安全
  if (!timeSlot || typeof timeSlot !== 'object') return '';
  if (timeSlot.label) {
    return `${timeSlot.label} (${timeSlot.startTime}〜${timeSlot.endTime})`;
  }
  return `${timeSlot.startTime}〜${timeSlot.endTime}`;
}

/**
 * DateTime候補をflat配列へ（回答データマッピング用）
 * - 他用途にも使えるよう汎用的に
 */
export function flattenCandidates(candidates: DateTimeCandidate[]): string[] {
  const flattened: string[] = [];
  candidates.forEach(candidate =>
    candidate.timeSlots.forEach(slot =>
      flattened.push(`${candidate.date}_${slot.id}`)
    )
  );
  return flattened;
}

/**
 * 指定日時がflat配列で何番目か返す
 * - パフォーマンス・テスト性も考慮
 */
export function getFlattenedIndex(
  candidates: DateTimeCandidate[],
  candidateIndex: number,
  timeSlotIndex: number
): number {
  if (
    !Array.isArray(candidates) ||
    candidateIndex < 0 ||
    timeSlotIndex < 0 ||
    candidateIndex >= candidates.length ||
    timeSlotIndex >= candidates[candidateIndex].timeSlots.length
  ) return -1;
  let idx = 0;
  for (let i = 0; i < candidateIndex; i++) {
    idx += candidates[i].timeSlots.length;
  }
  return idx + timeSlotIndex;
}

/**
 * flatIndex→候補日・時間帯の逆変換
 * - 配列長・存在チェックで安全
 */
export function getOriginalIndices(
  candidates: DateTimeCandidate[],
  flatIndex: number
): { candidateIndex: number; timeSlotIndex: number } | null {
  if (!Array.isArray(candidates) || flatIndex < 0) return null;
  let cur = 0;
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
    const slots = candidates[candidateIndex].timeSlots;
    for (let timeSlotIndex = 0; timeSlotIndex < slots.length; timeSlotIndex++) {
      if (cur === flatIndex) {
        return { candidateIndex, timeSlotIndex };
      }
      cur++;
    }
  }
  return null;
}
