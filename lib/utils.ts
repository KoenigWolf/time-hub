import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 複数のクラス名を結合し、Tailwind の競合クラスを自動で解決
 * 使用例: <div className={cn('p-4', isActive && 'bg-blue-500')} />
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
