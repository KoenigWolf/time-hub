import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { PollData, Answer, User, DateTimeCandidate } from '@/lib/types';
import {
  encodePollToUrl,
  decodePollFromUrl,
  savePollLocal,
} from '@/lib/poll-storage';
import {
  migrateDatesToCandidates,
  getTotalTimeSlots,
} from '@/lib/poll-utils';

// --- 副作用ハンドラの抽象化 ---
// URL+Storage同期。責務を isolate し、他ロジックから独立可能に
function syncPollDataToExternal(data: PollData, router: ReturnType<typeof useRouter>) {
  savePollLocal(data);
  const encoded = encodePollToUrl(data);
  if (encoded) {
    router.push(`/?poll=${encoded}`);
  }
}

// デバウンス制御を一元管理（型安全）しつつ副作用を完全制御
function useDebouncedCallback(cb: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const schedule = useCallback(() => {
    cancel();
    timer.current = setTimeout(cb, delay);
  }, [cb, delay, cancel]);
  useEffect(() => cancel, [cancel]);
  return schedule;
}

// Pollデータ復元処理を抽出（テスト容易化・分岐一元化）
function parsePollData(param: string | null): PollData | null {
  if (!param) return null;
  try {
    const decoded = decodePollFromUrl(param);
    if (!decoded) return null;
    if (decoded.dates && !decoded.candidates?.length) {
      return {
        ...decoded,
        candidates: migrateDatesToCandidates(decoded.dates),
        dates: undefined,
      };
    }
    return decoded;
  } catch {
    return null;
  }
}

// 型定義をexportして拡張・テストしやすく
export interface UsePollData {
  pollData: PollData;
  mounted: boolean;
  handleTitleChange: (title: string) => void;
  handleCandidatesChange: (candidates: DateTimeCandidate[]) => void;
  submitAnswer: (name: string, answers: Answer[]) => void;
  toggleExistingAnswer: (userIdx: number, flatIdx: number) => void;
  getShareUrl: () => string;
}

// --- 本体フック ---
export function usePollData(): UsePollData {
  const [pollData, setPollData] = useState<PollData>({
    title: '',
    candidates: [],
    users: [],
  });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 最新pollData参照用（副作用対応）
  const pollRef = useRef(pollData);
  pollRef.current = pollData;

  // マウント判定（SSR対応・テスト用に分離）
  useEffect(() => { setMounted(true); }, []);

  // --- 初回ロード処理 ---
  useEffect(() => {
    const next = parsePollData(searchParams.get('poll'));
    if (next) setPollData(next);
    else if (searchParams.get('poll')) router.replace('/');
    // eslint-disable-next-line
  }, [searchParams, router]);

  // --- URL/Storage 同期 ---
  const syncExternal = useCallback(
    (data: PollData) => syncPollDataToExternal(data, router),
    [router]
  );
  const debouncedSync = useDebouncedCallback(() => syncExternal(pollRef.current), 500);

  // --- 状態変更ハンドラ群 ---
  // 変更後すぐstate更新、その後同期処理
  const updatePoll = useCallback((next: PollData) => {
    setPollData(next);
    debouncedSync();
  }, [debouncedSync]);

  const handleTitleChange = useCallback((title: string) => {
    updatePoll({ ...pollRef.current, title });
  }, [updatePoll]);

  const handleCandidatesChange = useCallback((candidates: DateTimeCandidate[]) => {
    const total = getTotalTimeSlots(candidates);
    const users = pollRef.current.users.map(u => ({
      ...u,
      answers: u.answers.slice(0, total).concat(
        Array(Math.max(0, total - u.answers.length)).fill('×')
      )
    }));
    updatePoll({ ...pollRef.current, candidates, users });
  }, [updatePoll]);

  const submitAnswer = useCallback((name: string, answers: Answer[]) => {
    const userName = name.trim();
    if (!userName) return;
    const users = [...pollRef.current.users];
    const idx = users.findIndex(u => u.name === userName);
    const user: User = { name: userName, answers: [...answers] };
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    updatePoll({ ...pollRef.current, users });
  }, [updatePoll]);

  const toggleExistingAnswer = useCallback((userIdx: number, flatIdx: number) => {
    const users = pollRef.current.users.map((u, i) =>
      i !== userIdx ? u : {
        ...u,
        answers: u.answers.map((a, j) =>
          j === flatIdx ? (a === '○' ? '×' : '○') : a
        )
      }
    );
    updatePoll({ ...pollRef.current, users });
  }, [updatePoll]);

  const getShareUrl = useCallback((): string => {
    if (!mounted) return '';
    try {
      const encoded = encodePollToUrl(pollRef.current);
      if (!encoded) return '';
      return typeof window !== 'undefined'
        ? `${window.location.origin}/?poll=${encoded}`
        : `/?poll=${encoded}`;
    } catch {
      return '';
    }
  }, [mounted]);

  return {
    pollData,
    mounted,
    handleTitleChange,
    handleCandidatesChange,
    submitAnswer,
    toggleExistingAnswer,
    getShareUrl,
  };
}
