import { PollData } from './types';

/**
 * Poll用ストレージキー生成（拡張性: 英数字と一部記号のみ許可、将来的にバージョンや言語切り替えにも対応可）
 */
export function getPollStorageKey(title: string): string {
  // XSSやStorage衝突防止
  const safeTitle = typeof title === 'string' ? title.replace(/[^a-zA-Z0-9\-_]/g, '') : '';
  return `time-hub-poll-${safeTitle}`;
}

/**
 * Base64エンコード（UTF-8, URLセーフ、例外時フォールバック付き）
 */
export function safeBase64Encode(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Base64 encode error:', e);
    return encodeURIComponent(str); // フォールバック
  }
}

/**
 * Base64デコード（UTF-8, 例外時フォールバック付き）
 */
export function safeBase64Decode(encoded: string): string {
  try {
    // 標準的Base64チェック
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Base64 pattern check failed, using URL decode fallback');
      }
      return decodeURIComponent(encoded);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting Base64 decode...');
    }
    
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const result = new TextDecoder().decode(bytes);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Base64 decode successful');
    }
    
    return result;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Base64 decode error:', e);
      console.error('Encoded string:', encoded);
    }
    try {
      return decodeURIComponent(encoded);
    } catch (e2) {
      if (process.env.NODE_ENV === 'development') console.error('URL decode fallback failed:', e2);
      throw new Error('Failed to decode data');
    }
  }
}

/**
 * PollData→URLエンコード
 * - PollDataの構造変更時も型安全
 * - JSON.stringify失敗も考慮
 */
export function encodePollToUrl(pollData: PollData): string {
  try {
    return safeBase64Encode(JSON.stringify(pollData));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Failed to encode poll data:', e);
    return '';
  }
}

/**
 * URL→PollData復元（型安全・必須プロパティチェック・失敗時null返却）
 */
export function decodePollFromUrl(encoded: string): PollData | null {
  try {
    if (!encoded || typeof encoded !== 'string') return null;
    
    // デバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('Decoding URL param:', encoded.substring(0, 20) + '...');
    }
    
    const json = safeBase64Decode(encoded);
    
    // デバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('Base64 decoded JSON:', json.substring(0, 100) + '...');
    }
    
    const parsed: unknown = JSON.parse(json);

    // 型ガード: 最低限のプロパティ存在チェック
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'title' in parsed &&
      'candidates' in parsed &&
      'users' in parsed
    ) {
      return parsed as PollData;
    }
    throw new Error('Invalid poll data structure');
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to decode poll from URL:', e);
      console.error('Encoded string:', encoded);
      console.error('String length:', encoded.length);
    }
    return null;
  }
}

/**
 * PollDataをローカルストレージに保存（XSSやStorage上書き衝突防止、エラー通知拡張）
 */
export function savePollLocal(pollData: PollData): void {
  try {
    const key = getPollStorageKey(pollData.title);
    localStorage.setItem(key, JSON.stringify(pollData));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Failed to save poll:', e);
    // ここで可観測性（Sentry等通知）の拡張も容易
  }
}

/**
 * PollDataをローカルストレージから取得（バリデーション付き、失敗時null）
 */
export function loadPollLocal(title: string): PollData | null {
  try {
    const key = getPollStorageKey(title);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    // 最低限の構造チェック
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'title' in parsed &&
      'candidates' in parsed &&
      'users' in parsed
    ) {
      return parsed as PollData;
    }
    throw new Error('Invalid poll data structure in storage');
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Failed to load poll:', e);
    return null;
  }
}
