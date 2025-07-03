'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Share2 } from 'lucide-react';
import { PollData, BestDateTime, DateTimeCandidate } from '@/lib/types';
import { getDateTimeSummary, getTotalTimeSlots } from '@/lib/poll-utils';
import { formatTimeSlot, getFlattenedIndex } from '@/lib/calendar-utils';
import { formatDate } from '@/lib/date-utils';

interface DateTimeResultsTableProps {
  pollData: PollData;
  bestDateTimes: BestDateTime[];
  onToggleAnswer: (userIndex: number, flatIndex: number) => void;
  onShare: () => void;
}

/** テーブルヘッダー: 日付・時間帯カラム */
const DateTimeTableHeader = memo(function DateTimeTableHeader({
  candidates,
  pollData,
  bestDateTimes,
}: {
  candidates: DateTimeCandidate[];
  pollData: PollData;
  bestDateTimes: BestDateTime[];
}) {
  return (
    <tr className="border-b border-gray-100">
      <th className="text-left py-3 px-2 font-medium text-gray-700 min-w-[100px] sticky left-0 bg-white z-10">
        名前
      </th>
      {candidates.map((candidate, candidateIndex) => (
        <th
          key={candidate.date}
          className="text-center py-3 px-1 font-medium text-gray-700 min-w-[140px] border-l border-gray-100"
          colSpan={candidate.timeSlots.length}
        >
          <div className="space-y-1">
            <div className="text-sm font-semibold">
              {formatDate(candidate.date)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(candidate.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
            </div>
          </div>
        </th>
      ))}
    </tr>
  );
});

/** 時間帯サブヘッダー */
const TimeSlotSubHeader = memo(function TimeSlotSubHeader({
  candidates,
  pollData,
  bestDateTimes,
}: {
  candidates: DateTimeCandidate[];
  pollData: PollData;
  bestDateTimes: BestDateTime[];
}) {
  return (
    <tr className="border-b border-gray-200 bg-gray-50">
      <th className="py-2 px-2 sticky left-0 bg-gray-50 z-10"></th>
      {candidates.map((candidate, candidateIndex) =>
        candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
          const summary = getDateTimeSummary(pollData, candidateIndex, timeSlotIndex);
          const isBest = bestDateTimes.some(
            best => best.candidateIndex === candidateIndex && best.timeSlotIndex === timeSlotIndex
          );

          return (
            <th
              key={timeSlot.id}
              className={`text-center py-2 px-1 font-medium text-gray-600 text-xs min-w-[70px] border-l border-gray-200 ${
                isBest ? 'bg-green-100' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="font-medium">
                  {formatTimeSlot(timeSlot)}
                </div>
                <div className="text-gray-500">
                  {summary.available}名
                </div>
                {isBest && (
                  <Badge variant="outline" className="bg-green-200 border-green-300 text-green-800 text-[10px] px-1 py-0">
                    最適
                  </Badge>
                )}
              </div>
            </th>
          );
        })
      )}
    </tr>
  );
});

/** 回答行: 各ユーザーごとの一行 */
const DateTimeResultsRow = memo(function DateTimeResultsRow({
  user,
  userIndex,
  candidates,
  onToggleAnswer,
}: {
  user: PollData['users'][number];
  userIndex: number;
  candidates: DateTimeCandidate[];
  onToggleAnswer: (userIndex: number, flatIndex: number) => void;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-25">
      <td className="py-3 px-2 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
        {user.name}
      </td>
      {candidates.map((candidate, candidateIndex) =>
        candidate.timeSlots.map((timeSlot, timeSlotIndex) => {
          const flatIndex = getFlattenedIndex(candidates, candidateIndex, timeSlotIndex);
          const answer = user.answers[flatIndex] || '×';

          return (
            <td key={timeSlot.id} className="py-3 px-1 text-center border-l border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleAnswer(userIndex, flatIndex)}
                className={`w-8 h-8 p-0 ${
                  answer === '○'
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
                aria-label={`${user.name}の${formatDate(candidate.date)} ${formatTimeSlot(timeSlot)}の回答: ${answer}`}
                type="button"
              >
                {answer}
              </Button>
            </td>
          );
        })
      )}
    </tr>
  );
});

/** 日時候補結果テーブル */
export const DateTimeResultsTable = memo(function DateTimeResultsTable({
  pollData,
  bestDateTimes,
  onToggleAnswer,
  onShare,
}: DateTimeResultsTableProps) {
  const totalTimeSlots = getTotalTimeSlots(pollData.candidates);

  if (!pollData.users.length || !totalTimeSlots) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" aria-label="回答人数" />
            <span className="font-medium text-gray-900">
              回答結果（{pollData.users.length}名）
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="border-gray-200 text-gray-600 hover:text-gray-900"
            aria-label="結果を共有"
            type="button"
          >
            <Share2 className="h-4 w-4 mr-1" />
            共有
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <DateTimeTableHeader
                candidates={pollData.candidates}
                pollData={pollData}
                bestDateTimes={bestDateTimes}
              />
              <TimeSlotSubHeader
                candidates={pollData.candidates}
                pollData={pollData}
                bestDateTimes={bestDateTimes}
              />
            </thead>
            <tbody>
              {pollData.users.map((user, userIndex) => (
                <DateTimeResultsRow
                  key={`${user.name}-${userIndex}`}
                  user={user}
                  userIndex={userIndex}
                  candidates={pollData.candidates}
                  onToggleAnswer={onToggleAnswer}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* 参加可能数の統計 */}
        {bestDateTimes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">最多参加可能な日時</h4>
            <div className="flex flex-wrap gap-2">
              {bestDateTimes.slice(0, 5).map((best, index) => (
                <Badge
                  key={`${best.candidateIndex}-${best.timeSlotIndex}`}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-800"
                >
                  {formatDate(best.date)} {formatTimeSlot(best.timeSlot)} ({best.available}名)
                </Badge>
              ))}
              {bestDateTimes.length > 5 && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                  他{bestDateTimes.length - 5}件
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}); 