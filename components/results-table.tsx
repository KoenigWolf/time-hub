'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Share2 } from 'lucide-react';
import { PollData } from '@/lib/types';
import { formatDate } from '@/lib/date-utils';

// 最適日データ型
export interface BestDate {
  index: number;
  available: number;
}

// 回答テーブルprops型
export interface ResultsTableProps {
  pollData: PollData;
  bestDates: BestDate[];
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
  onShare: () => void;
}

// dates配列から有効日付のみ抽出
const getValidDates = (dates: string[]): string[] =>
  dates.filter(d => !!d.trim());

// 各日付の出席可能人数集計
const getDateSummary = (pollData: PollData, dateIdx: number) => ({
  available: pollData.users.reduce(
    (sum, user) => sum + (user.answers[dateIdx] === '○' ? 1 : 0),
    0
  ),
});

// 回答行コンポーネント（ユーザー単位で責務分離）
interface ResultsTableRowProps {
  user: PollData['users'][number];
  userIndex: number;
  dateCount: number;
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
  allOkColumns: boolean[];
}
const ResultsTableRow = memo(function ResultsTableRow({
  user,
  userIndex,
  dateCount,
  onToggleAnswer,
  allOkColumns,
}: ResultsTableRowProps) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-25">
      <td className="py-3 px-2 font-medium text-gray-900">{user.name}</td>
      {user.answers.slice(0, dateCount).map((answer: string, dateIndex: number) => (
        <td
          key={dateIndex}
          className={`py-3 px-2 text-center ${allOkColumns[dateIndex] ? 'bg-yellow-100' : ''}`}
        >
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

// ヘッダーコンポーネント（日付・人数・最適日ラベル責務分離）
interface ResultsTableHeaderProps {
  validDates: string[];
  pollData: PollData;
  bestDates: BestDate[];
}
const ResultsTableHeader = memo(function ResultsTableHeader({
  validDates,
  pollData,
  bestDates,
}: ResultsTableHeaderProps) {
  return (
    <tr className="border-b border-gray-100">
      <th className="text-left py-3 px-2 font-medium text-gray-700 min-w-[100px]">
        名前
      </th>
      {validDates.map((date: string, idx: number) => {
        const { available } = getDateSummary(pollData, idx);
        const isBest = bestDates.some((best: BestDate) => best.index === idx);
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
              <div className="text-xs text-gray-500">{available}名</div>
            </div>
          </th>
        );
      })}
    </tr>
  );
});

// 回答テーブル本体
export const ResultsTable = memo(function ResultsTable({
  pollData,
  bestDates,
  onToggleAnswer,
  onShare,
}: ResultsTableProps) {
  // 有効日付抽出
  const validDates = getValidDates(pollData.dates || []);
  if (!pollData.users.length || !validDates.length) return null;

  // 全員○の列を判定
  const allOkColumns = validDates.map((_, dateIdx) =>
    pollData.users.every(user => user.answers[dateIdx] === '○')
  );

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
                  allOkColumns={allOkColumns}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
