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

/**
 * Safely sync poll data to URL and LocalStorage.
 * Extensible: allow sanitization, custom url param, or analytics hooks.
 */
function syncPollDataToExternal(data: PollData, router: ReturnType<typeof useRouter>): void {
  try {
    savePollLocal(data);
    const encoded = encodePollToUrl(data);
    if (encoded) {
      router.push(`/?poll=${encoded}`);
    }
  } catch (e) {
    // You could send error logs to Sentry etc.
    if (process.env.NODE_ENV === 'development') {
      console.error('[PollData Sync Error]', e);
    }
  }
}

/**
 * Reusable debounce utility for any callback (with proper cleanup).
 */
function useDebouncedCallback(cb: () => void, delay = 500) {
  const timer = useRef<NodeJS.Timeout | null>(null);

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

/**
 * Safely parse PollData from url param. Returns null if decode or migrate fails.
 * Extendable: can handle versioning, validation, etc.
 */
export function parsePollData(param: string | null): PollData | null {
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
    // Add further validation if needed here
    return decoded;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      // i18n対応もしやすい（ログなどで日本語・英語切替も可）
      console.warn('[Poll parse error]', e);
    }
    return null;
  }
}

/**
 * Type for usePollData hook.
 * Add callback hooks or version property for more extensibility.
 */
export interface UsePollData {
  pollData: PollData;
  mounted: boolean;
  handleTitleChange: (title: string) => void;
  handleCandidatesChange: (candidates: DateTimeCandidate[]) => void;
  submitAnswer: (name: string, answers: Answer[]) => void;
  toggleExistingAnswer: (userIdx: number, flatIdx: number) => void;
  getShareUrl: () => string;
}

export function usePollData(): UsePollData {
  const [pollData, setPollData] = useState<PollData>({
    title: '',
    candidates: [],
    users: [],
  });
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep the latest pollData for debounce/callback
  const pollRef = useRef(pollData);
  pollRef.current = pollData;

  // SSR compatibility
  useEffect(() => { setMounted(true); }, []);

  // Initial load from URL param (handles SSR hydration, migration, XSS, etc.)
  useEffect(() => {
    const param = searchParams.get('poll');
    if (param) {
      const loaded = parsePollData(param);
      if (loaded) {
        setPollData(loaded);
      } else {
        // 無効なURLパラメータの場合はクリア
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid poll parameter detected, clearing URL');
        }
        router.replace('/');
      }
    }
    // eslint-disable-next-line
  }, [searchParams, router]);

  // Save poll data to storage and url after any changes (debounced)
  const syncExternal = useCallback(
    (data: PollData) => syncPollDataToExternal(data, router),
    [router]
  );
  const debouncedSync = useDebouncedCallback(() => syncExternal(pollRef.current), 500);

  // Update poll data and trigger save/debounce
  const updatePoll = useCallback((next: PollData) => {
    setPollData(next);
    debouncedSync();
  }, [debouncedSync]);

  // Title update handler
  const handleTitleChange = useCallback((title: string) => {
    updatePoll({ ...pollRef.current, title });
  }, [updatePoll]);

  // Candidate/time update handler
  const handleCandidatesChange = useCallback((candidates: DateTimeCandidate[]) => {
    const total = getTotalTimeSlots(candidates);
    // Validate each user's answers: fill or trim to match slots
    const users = pollRef.current.users.map(u => ({
      ...u,
      answers: u.answers
        .slice(0, total)
        .concat(Array(Math.max(0, total - u.answers.length)).fill('×')),
    }));
    updatePoll({ ...pollRef.current, candidates, users });
  }, [updatePoll]);

  // Register or update user's answers by name (trim/validate)
  const submitAnswer = useCallback((name: string, answers: Answer[]) => {
    const userName = name.trim();
    if (!userName) return;
    // Optionally: sanitize answers ('○'|'×'以外を弾くなど)
    const sanitizedAnswers = answers.map(a => (a === '○' ? '○' : '×'));
    const users = [...pollRef.current.users];
    const idx = users.findIndex(u => u.name === userName);
    const user: User = { name: userName, answers: [...sanitizedAnswers] };
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    updatePoll({ ...pollRef.current, users });
  }, [updatePoll]);

  // Admin-style answer toggle (for result table etc.)
  const toggleExistingAnswer = useCallback((userIdx: number, flatIdx: number) => {
    const users = pollRef.current.users.map((u, i) =>
      i !== userIdx ? u : {
        ...u,
        answers: u.answers.map((a, j) => (j === flatIdx ? (a === '○' ? '×' : '○') : a)),
      }
    );
    updatePoll({ ...pollRef.current, users });
  }, [updatePoll]);

  // Generate shareable url (SSR/CSR-safe)
  const getShareUrl = useCallback((): string => {
    if (!mounted) return '';
    try {
      const encoded = encodePollToUrl(pollRef.current);
      if (!encoded) return '';
      return typeof window !== 'undefined'
        ? `${window.location.origin}/?poll=${encoded}`
        : `/?poll=${encoded}`;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ShareUrl error]', e);
      }
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
