import { format, parse, isValid, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

/** yyyy-MM-dd 文字列を M月d日（E）形式で返す。失敗時は元文字列返却 */
export function formatDate(dateString: string): string {
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  return isValid(date)
    ? format(date, 'M月d日（E）', { locale: ja })
    : dateString;
}

/** 時刻文字列をそのまま返却（将来的な拡張を見越し関数化） */
export function formatTime(time: string): string {
  return time;
}

/** 日付＋時刻範囲を「M月d日（E） HH:mm-HH:mm」形式で返す */
export function formatDateRange(
  date: string,
  startTime: string,
  endTime: string
): string {
  return `${formatDate(date)} ${startTime}-${endTime}`;
}

/** 日付・時刻範囲から一意ID生成（例: 2025-08-01_10:00_12:00） */
export function generateTimeSlotId(
  date: string,
  startTime: string,
  endTime: string
): string {
  return [date, startTime, endTime].join('_');
}

/** タイムスロットIDから分解 */
export function parseTimeSlotId(
  id: string
): { date: string; startTime: string; endTime: string } | null {
  const [date, startTime, endTime] = id.split('_');
  return date && startTime && endTime
    ? { date, startTime, endTime }
    : null;
}

/** yyyy-MM-ddが「今日以降」の有効日付か判定 */
export function validateDate(dateString: string): boolean {
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  return isValid(date) && startOfDay(date) >= startOfDay(new Date());
}

/** HH:mm フォーマットかを判定 */
export function validateTime(time: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);
}
