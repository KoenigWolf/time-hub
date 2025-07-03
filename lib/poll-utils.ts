import { PollData, DateSummary, BestDateTime, Answer, DateTimeCandidate } from './types';
import { getFlattenedIndex, getOriginalIndices } from './calendar-utils';

// UUID生成の代替実装（ブラウザ対応）
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック実装
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** 指定した候補日時の参加可能人数を計算 */
export function getDateTimeSummary(
  pollData: PollData,
  candidateIndex: number,
  timeSlotIndex: number
): DateSummary {
  const flatIndex = getFlattenedIndex(pollData.candidates, candidateIndex, timeSlotIndex);
  const available = pollData.users.reduce(
    (sum, user) => sum + (user.answers[flatIndex] === '○' ? 1 : 0),
    0
  );
  return { available };
}

/** 最多参加者の候補日時リストを取得（同数が複数でも全て返す） */
export function getBestDateTimes(pollData: PollData): BestDateTime[] {
  if (!pollData.users.length || !pollData.candidates.length) return [];

  const allCandidates: BestDateTime[] = [];
  
  pollData.candidates.forEach((candidate, candidateIndex) => {
    candidate.timeSlots.forEach((timeSlot, timeSlotIndex) => {
      const summary = getDateTimeSummary(pollData, candidateIndex, timeSlotIndex);
      allCandidates.push({
        candidateIndex,
        timeSlotIndex,
        available: summary.available,
        date: candidate.date,
        timeSlot,
      });
    });
  });

  const max = Math.max(...allCandidates.map(c => c.available));
  return allCandidates.filter(c => c.available === max && max > 0);
}

/** 回答(○×)をトグル */
export const toggleAnswer = (a: Answer): Answer => (a === '○' ? '×' : '○');

/** 有効な候補日時があるか */
export const hasValidCandidates = (candidates: DateTimeCandidate[]): boolean =>
  candidates.some(c => c.timeSlots.length > 0);

/** 総候補日時数を計算 */
export function getTotalTimeSlots(candidates: DateTimeCandidate[]): number {
  return candidates.reduce((total, candidate) => total + candidate.timeSlots.length, 0);
}

/** 旧形式からの移行用：dates配列をcandidatesに変換 */
export function migrateDatesToCandidates(dates: string[]): DateTimeCandidate[] {
  return dates
    .filter(date => date.trim())
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

/** 旧形式との互換性：BestDateTimeからBestDateに変換 */
export function getBestDates(pollData: PollData) {
  // 後方互換性のため、旧形式のdatesがある場合の処理
  if (pollData.dates && !pollData.candidates?.length) {
    const candidates = migrateDatesToCandidates(pollData.dates);
    const tempPollData = { ...pollData, candidates };
    const bestDateTimes = getBestDateTimes(tempPollData);
    return bestDateTimes.map(best => ({
      index: best.candidateIndex,
      available: best.available,
    }));
  }

  const bestDateTimes = getBestDateTimes(pollData);
  return bestDateTimes.map(best => ({
    index: best.candidateIndex,
    available: best.available,
  }));
}
