import type { Locale } from 'date-fns'; // 型の明示import（型定義のみ依存でビルド軽量）
import { format, parse, isValid, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付を指定ロケール・フォーマットで表示文字列化します。
 * @param dateString "yyyy-MM-dd" 形式の日付
 * @param locale date-fns の Locale オブジェクト（デフォルト: ja）
 * @param formatStr date-fns のフォーマット文字列（デフォルト: 'M月d日（E）'）
 * @returns フォーマット済み日付、失敗時は元文字列
 */
export function formatDate(
  dateString: string,
  locale: Locale = ja,
  formatStr = 'M月d日（E）'
): string {
  if (!dateString || typeof dateString !== 'string') return '';
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  return isValid(date)
    ? format(date, formatStr, { locale })
    : dateString;
}

/**
 * 時刻文字列（"HH:mm"）をそのまま返却。
 * 将来的なi18n拡張や表記カスタマイズを考慮したラッパーです。
 */
export function formatTime(time: string): string {
  if (!validateTime(time)) return '';
  return time;
}

/**
 * 日付＋時刻範囲をロケール・書式指定で返します。
 * 例: "8月1日（木） 09:00-10:00"
 */
export function formatDateRange(
  date: string,
  startTime: string,
  endTime: string,
  locale: Locale = ja
): string {
  return `${formatDate(date, locale)} ${formatTime(startTime)}-${formatTime(endTime)}`;
}

/**
 * 一意なTimeSlotIDを生成します。
 * セキュリティ: 無効文字列の除外も考慮。
 */
export function generateTimeSlotId(
  date: string,
  startTime: string,
  endTime: string
): string {
  // 入力バリデーション
  if (!validateDate(date) || !validateTime(startTime) || !validateTime(endTime)) {
    throw new Error('Invalid date or time for TimeSlotId');
  }
  // XSSや改行などを除去
  const clean = (s: string) => s.replace(/[^\w:-]/g, '');
  return [clean(date), clean(startTime), clean(endTime)].join('_');
}

/**
 * タイムスロットIDを分解します。
 * @returns { date, startTime, endTime } か null
 */
export function parseTimeSlotId(
  id: string
): { date: string; startTime: string; endTime: string } | null {
  if (!id || typeof id !== 'string') return null;
  const [date, startTime, endTime] = id.split('_');
  if (validateDate(date) && validateTime(startTime) && validateTime(endTime)) {
    return { date, startTime, endTime };
  }
  return null;
}

/**
 * yyyy-MM-dd 形式が「今日以降」の有効日付か判定します。
 */
export function validateDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  if (!isValid(date)) return false;
  return startOfDay(date).getTime() >= startOfDay(new Date()).getTime();
}

/**
 * "HH:mm" 形式かどうかを判定します。
 */
export function validateTime(time: string): boolean {
  return typeof time === 'string'
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/**
 * 任意の日付が「今日」か判定します。
 */
export function isToday(dateString: string): boolean {
  if (!validateDate(dateString)) return false;
  const d = parse(dateString, 'yyyy-MM-dd', new Date());
  const today = startOfDay(new Date());
  return d.getTime() === today.getTime();
}

/**
 * 日付フォーマットエラー時の可観測性フックポイント。
 * Sentryやログサービスと連携するために設計されています。
 */
export function onDateFormatError(error: unknown, context?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Date format error', error, context);
  }
}
