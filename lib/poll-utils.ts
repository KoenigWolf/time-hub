import {
  PollData,
  DateSummary,
  BestDateTime,
  Answer,
  DateTimeCandidate,
  BestDate,
} from './types';
import { getFlattenedIndex } from './calendar-utils';

/**
 * 安全な一意ID（UUID v4）生成
 * - crypto.randomUUID未対応環境もカバー
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // レガシー対応（例：IE, 古いNode等）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 候補日時ごとの参加可能人数（'○'）集計
 */
export function getDateTimeSummary(
  pollData: PollData,
  candidateIndex: number,
  timeSlotIndex: number
): DateSummary {
  if (
    !pollData?.users?.length ||
    !pollData?.candidates?.[candidateIndex]?.timeSlots?.[timeSlotIndex]
  ) {
    return { available: 0 };
  }
  const flatIndex = getFlattenedIndex(pollData.candidates, candidateIndex, timeSlotIndex);
  const available = pollData.users.reduce(
    (sum, user) => sum + (user.answers?.[flatIndex] === '○' ? 1 : 0),
    0
  );
  return { available };
}

/**
 * すべてのユーザーが参加可能な候補日時を全件返す
 * - 時間帯単位
 */
export function getBestDateTimes(pollData: PollData): BestDateTime[] {
  const { users, candidates } = pollData;
  if (!users?.length || !candidates?.length) return [];

  const totalUsers = users.length;
  const result: BestDateTime[] = [];

  candidates.forEach((candidate, candidateIndex) => {
    candidate.timeSlots?.forEach((timeSlot, timeSlotIndex) => {
      const { available } = getDateTimeSummary(pollData, candidateIndex, timeSlotIndex);
      if (available === totalUsers && totalUsers > 0) {
        result.push({
          candidateIndex,
          timeSlotIndex,
          available,
          date: candidate.date,
          timeSlot,
        });
      }
    });
  });

  return result;
}

/**
 * 回答を '○' <-> '×' でトグル
 */
export function toggleAnswer(a: Answer): Answer {
  return a === '○' ? '×' : '○';
}

/**
 * 有効な候補が存在するか
 */
export function hasValidCandidates(candidates: DateTimeCandidate[]): boolean {
  return Array.isArray(candidates) && candidates.some(c => c.timeSlots?.length > 0);
}

/**
 * 総時間帯数（回答用配列長）
 */
export function getTotalTimeSlots(candidates: DateTimeCandidate[]): number {
  return Array.isArray(candidates)
    ? candidates.reduce((total, c) => total + (c.timeSlots?.length ?? 0), 0)
    : 0;
}

/**
 * 旧データ（dates[]のみ）から候補配列に変換（自動マイグレーション）
 */
export function migrateDatesToCandidates(dates: string[]): DateTimeCandidate[] {
  if (!Array.isArray(dates)) return [];
  return dates
    .filter(date => typeof date === 'string' && !!date.trim())
    .map(date => ({
      date,
      timeSlots: [
        {
          id: generateId(),
          startTime: '09:00',
          endTime: '18:00',
          label: '終日',
        },
      ],
    }));
}

/**
 * 最適日（BestDateTime[] → BestDate[] への変換。日単位で返す）
 * - 旧データにも自動対応
 */
export function getBestDates(pollData: PollData): BestDate[] {
  let target: PollData = pollData;
  if (
    pollData?.dates &&
    (!pollData.candidates || pollData.candidates.length === 0)
  ) {
    target = {
      ...pollData,
      candidates: migrateDatesToCandidates(pollData.dates),
    };
  }
  const bestDateTimes = getBestDateTimes(target);
  return bestDateTimes.map(({ candidateIndex, available }) => ({
    index: candidateIndex,
    available,
  }));
}
