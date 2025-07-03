'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Share2 } from 'lucide-react';
import { PollData } from '@/lib/types';
import { formatDate } from '@/lib/date-utils';

interface BestDate {
  index: number;
  available: number;
}

interface ResultsTableProps {
  pollData: PollData;
  bestDates: BestDate[];
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
  onShare: () => void;
}

// 後方互換性のためのヘルパー関数
const getValidDates = (dates: string[]): string[] =>
  dates.filter(d => !!d.trim());

const getDateSummary = (pollData: PollData, dateIdx: number) => {
  const available = pollData.users.reduce(
    (sum, user) => sum + (user.answers[dateIdx] === '○' ? 1 : 0),
    0
  );
  return { available };
};

/** 回答行: 各ユーザーごとの一行 */
const ResultsTableRow = memo(function ResultsTableRow({
  user,
  userIndex,
  dateCount,
  onToggleAnswer,
}: {
  user: PollData['users'][number];
  userIndex: number;
  dateCount: number;
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-25">
      <td className="py-3 px-2 font-medium text-gray-900">{user.name}</td>
      {user.answers.slice(0, dateCount).map((answer, dateIndex) => (
        <td key={dateIndex} className="py-3 px-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleAnswer(userIndex, dateIndex)}
            className={`w-8 h-8 p-0 ${
              answer === '○'
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            aria-label={`${user.name}の${dateIndex + 1}番目の回答: ${answer}`}
            type="button"
          >
            {answer}
          </Button>
        </td>
      ))}
    </tr>
  );
});

/** テーブルヘッダー: 日付カラム */
const ResultsTableHeader = memo(function ResultsTableHeader({
  validDates,
  pollData,
  bestDates,
}: {
  validDates: string[];
  pollData: PollData;
  bestDates: BestDate[];
}) {
  return (
    <tr className="border-b border-gray-100">
      <th className="text-left py-3 px-2 font-medium text-gray-700 min-w-[100px]">
        名前
      </th>
      {validDates.map((date, idx) => {
        const summary = getDateSummary(pollData, idx);
        const isBest = bestDates.some(best => best.index === idx);
        return (
          <th
            key={date}
            className={`text-center py-3 px-2 font-medium text-gray-700 min-w-[80px] ${
              isBest ? 'bg-green-50' : ''
            }`}
            aria-label={isBest ? '最適日' : undefined}
          >
            <div className="space-y-1">
              <div className="text-xs">{formatDate(date)}</div>
              <div className="text-xs text-gray-500">{summary.available}名</div>
            </div>
          </th>
        );
      })}
    </tr>
  );
});

/** 回答テーブル全体 */
export const ResultsTable = memo(function ResultsTable({
  pollData,
  bestDates,
  onToggleAnswer,
  onShare,
}: ResultsTableProps) {
  const validDates = getValidDates(pollData.dates || []);

  if (!pollData.users.length || !validDates.length) return null;

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
          <table className="w-full">
            <thead>
              <ResultsTableHeader
                validDates={validDates}
                pollData={pollData}
                bestDates={bestDates}
              />
            </thead>
            <tbody>
              {pollData.users.map((user, userIndex) => (
                <ResultsTableRow
                  key={`${user.name}-${userIndex}`}
                  user={user}
                  userIndex={userIndex}
                  dateCount={validDates.length}
                  onToggleAnswer={onToggleAnswer}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
