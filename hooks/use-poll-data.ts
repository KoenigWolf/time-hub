import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PollData, Answer, User, DateTimeCandidate } from '@/lib/types';
import { encodePollToUrl, decodePollFromUrl, savePollLocal } from '@/lib/poll-storage';
import { migrateDatesToCandidates, getTotalTimeSlots } from '@/lib/poll-utils';

/**
 * 日程調整データの状態管理フック。
 * URL・ローカルストレージ同期・編集・回答・シェアまで一括管理。
 * 新形式（candidates）と旧形式（dates）の両方に対応。
 */
export function usePollData() {
  const [pollData, setPollData] = useState<PollData>({
    title: '',
    candidates: [],
    users: [],
  });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // デバウンス用のref
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pollDataRef = useRef(pollData);
  
  // pollDataRefを常に最新に保つ
  useEffect(() => {
    pollDataRef.current = pollData;
  }, [pollData]);

  // マウント検知
  useEffect(() => { setMounted(true); }, []);

  // URLからデータ復元（poll paramのみ責務集中）
  useEffect(() => {
    const pollParam = searchParams.get('poll');
    if (pollParam) {
      try {
        const decoded = decodePollFromUrl(pollParam);
        if (decoded) {
          // 旧形式から新形式への移行
          if (decoded.dates && !decoded.candidates?.length) {
            const migratedCandidates = migrateDatesToCandidates(decoded.dates);
            setPollData({
              ...decoded,
              candidates: migratedCandidates,
              dates: undefined, // 旧形式を削除
            });
          } else {
            setPollData(decoded);
          }
        } else {
          // デコードに失敗した場合はURLパラメータをクリア
          console.warn('Invalid poll URL parameter detected, clearing URL');
          router.replace('/');
        }
      } catch (error) {
        console.error('Error processing poll URL parameter:', error);
        // エラーが発生した場合もURLをクリア
        router.replace('/');
      }
    }
    // eslint-disable-next-line
  }, [searchParams, router]);

  // URL更新とローカルストレージ保存（デバウンス付き）
  const updateUrlAndStorage = useCallback((data: PollData) => {
    // 既存のタイマーをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // デバウンス（500ms）
    timeoutRef.current = setTimeout(() => {
      try {
        savePollLocal(data);
        const encoded = encodePollToUrl(data);
        if (encoded) {
          router.push(`/?poll=${encoded}`);
        } else {
          console.warn('Failed to encode poll data, staying on current page');
        }
      } catch (error) {
        console.error('Error updating URL and storage:', error);
      }
    }, 500);
  }, [router]);

  // Pollデータ変更（即座にstateを更新、URLとストレージはデバウンス）
  const updatePollData = useCallback((next: PollData) => {
    setPollData(next);
    updateUrlAndStorage(next);
  }, [updateUrlAndStorage]);

  // タイトル変更（最適化版）
  const handleTitleChange = useCallback((title: string) => {
    // stateを即座に更新
    setPollData(prev => ({ ...prev, title }));
    
    // URL更新はデバウンス
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        const currentData = { ...pollDataRef.current, title };
        savePollLocal(currentData);
        const encoded = encodePollToUrl(currentData);
        if (encoded) {
          router.push(`/?poll=${encoded}`);
        } else {
          console.warn('Failed to encode poll data during title change');
        }
      } catch (error) {
        console.error('Error updating URL during title change:', error);
      }
    }, 500);
  }, [router]);

  // 候補日時変更
  const handleCandidatesChange = useCallback((candidates: DateTimeCandidate[]) => {
    setPollData(prev => {
      // 既存ユーザーの回答数を新しい候補日時数に合わせる
      const totalSlots = getTotalTimeSlots(candidates);
      const updatedUsers = prev.users.map(user => ({
        ...user,
        answers: user.answers.slice(0, totalSlots).concat(
          Array(Math.max(0, totalSlots - user.answers.length)).fill('×')
        )
      }));

      const newData = {
        ...prev,
        candidates,
        users: updatedUsers,
      };
      
      updateUrlAndStorage(newData);
      return newData;
    });
  }, [updateUrlAndStorage]);

  // 回答追加/更新
  const submitAnswer = useCallback((userName: string, answers: Answer[]) => {
    const name = userName.trim();
    if (!name) return;
    
    setPollData(prev => {
      const idx = prev.users.findIndex(u => u.name === name);
      const newUser: User = { name, answers: [...answers] };
      let users;
      if (idx >= 0) {
        users = prev.users.slice();
        users[idx] = newUser;
      } else {
        users = [...prev.users, newUser];
      }
      
      const newData = { ...prev, users };
      updateUrlAndStorage(newData);
      return newData;
    });
  }, [updateUrlAndStorage]);

  // 回答トグル（フラット配列のインデックスベース）
  const toggleExistingAnswer = useCallback((userIdx: number, flatIndex: number) => {
    setPollData(prev => {
      const users = prev.users.map((u, i) =>
        i === userIdx
          ? { 
              ...u, 
              answers: u.answers.map((a, j) => 
                j === flatIndex ? (a === '○' ? '×' : '○') : a
              ) 
            }
          : u
      );
      
      const newData = { ...prev, users };
      updateUrlAndStorage(newData);
      return newData;
    });
  }, [updateUrlAndStorage]);

  // シェアURL生成
  const getShareUrl = useCallback(() => {
    if (!mounted) return '';
    try {
      const encoded = encodePollToUrl(pollData);
      if (!encoded) {
        console.warn('Failed to encode poll data for sharing');
        return '';
      }
      return `${typeof window !== 'undefined' ? window.location.origin : ''}/?poll=${encoded}`;
    } catch (error) {
      console.error('Error generating share URL:', error);
      return '';
    }
  }, [mounted, pollData]);

  // 後方互換性のための関数（旧コンポーネント用）
  const handleDateChange = useCallback((index: number, date: string) => {
    // 旧形式のインターフェース用
    if (pollData.dates) {
      const dates = pollData.dates.slice();
      dates[index] = date;
      const candidates = migrateDatesToCandidates(dates);
      handleCandidatesChange(candidates);
    }
  }, [pollData.dates, handleCandidatesChange]);

  const addDate = useCallback(() => {
    // 旧形式のインターフェース用
    if (pollData.dates) {
      const dates = [...pollData.dates, ''];
      const candidates = migrateDatesToCandidates(dates);
      handleCandidatesChange(candidates);
    }
  }, [pollData.dates, handleCandidatesChange]);

  const removeDate = useCallback((index: number) => {
    // 旧形式のインターフェース用
    if (pollData.dates && pollData.dates.length > 1) {
      const dates = pollData.dates.filter((_, i) => i !== index);
      const candidates = migrateDatesToCandidates(dates);
      handleCandidatesChange(candidates);
    }
  }, [pollData.dates, handleCandidatesChange]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    pollData,
    mounted,
    // 新形式
    handleTitleChange,
    handleCandidatesChange,
    submitAnswer,
    toggleExistingAnswer,
    getShareUrl,
    // 後方互換性
    handleDateChange,
    addDate,
    removeDate,
  };
}
