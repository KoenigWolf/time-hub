import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 安全かつ拡張可能なクラス結合ユーティリティ
 *
 * - falsy値（null, undefined, false, ''）は自動除去
 * - Tailwind CSS の競合も自動解決
 * - 拡張のため汎用命名 (cn: class names)
 * - 国際化・BEM・CSS-in-JS混在など将来の適用にも柔軟
 *
 * @param inputs 可変長のクラス指定（文字列・配列・オブジェクトも可）
 * @returns マージ後のクラス名文字列
 *
 * @example
 *   <div className={cn('p-4', isActive && 'bg-blue-500', extraClass)} />
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}
