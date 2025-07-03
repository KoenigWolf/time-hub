import { PollData } from './types';

/** ローカルストレージ用のキーを生成（title依存、英数字のみ） */
const getPollStorageKey = (title: string) =>
  `time-hub-poll-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

/** 安全なBase64エンコード（UTF-8対応） */
function safeBase64Encode(str: string): string {
  try {
    // TextEncoderを使用してUTF-8バイト配列に変換
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    // バイト配列をBase64に変換
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  } catch (e) {
    console.error('Base64 encode error:', e);
    // フォールバック: URLエンコード
    return encodeURIComponent(str);
  }
}

/** 安全なBase64デコード（UTF-8対応） */
function safeBase64Decode(encoded: string): string {
  try {
    // Base64形式かチェック
    if (!encoded.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      // Base64でない場合はURLデコードを試行
      return decodeURIComponent(encoded);
    }
    
    // Base64デコード
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // TextDecoderを使用してUTF-8文字列に変換
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (e) {
    console.error('Base64 decode error:', e);
    // フォールバック: URLデコード
    try {
      return decodeURIComponent(encoded);
    } catch (e2) {
      console.error('URL decode fallback failed:', e2);
      throw new Error('Failed to decode data');
    }
  }
}

/** PollDataをURL安全なBase64文字列にエンコード（UTF-8対応） */
export function encodePollToUrl(pollData: PollData): string {
  try {
    const json = JSON.stringify(pollData);
    return safeBase64Encode(json);
  } catch (e) {
    console.error('Failed to encode poll data:', e);
    return '';
  }
}

/** URLからPollDataをデコード（UTF-8対応、失敗時null） */
export function decodePollFromUrl(encoded: string): PollData | null {
  try {
    // 空文字列や不正な文字列のチェック
    if (!encoded || encoded.trim() === '') {
      return null;
    }
    
    const json = safeBase64Decode(encoded);
    const parsed = JSON.parse(json) as PollData;
    
    // 基本的な構造チェック
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid poll data structure');
    }
    
    // 必要なプロパティの存在チェック
    if (!parsed.hasOwnProperty('title')) {
      throw new Error('Missing required property: title');
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to decode poll from URL:', e);
    return null;
  }
}

/** PollDataをローカルストレージに保存 */
export function savePollLocal(pollData: PollData): void {
  try {
    const key = getPollStorageKey(pollData.title);
    localStorage.setItem(key, JSON.stringify(pollData));
  } catch (e) {
    console.error('Failed to save poll:', e);
  }
}

/** ローカルストレージからPollDataを取得（titleがkey） */
export function loadPollLocal(title: string): PollData | null {
  try {
    const key = getPollStorageKey(title);
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as PollData) : null;
  } catch (e) {
    console.error('Failed to load poll:', e);
    return null;
  }
}
