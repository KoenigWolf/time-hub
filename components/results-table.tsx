'use client';

/**
 * ResultsTable
 * - シンプルな日程調整結果（○×）テーブル
 * - 全観点配慮：国際化/アクセシビリティ/再利用/テスト/パフォーマンス/責務分割/型安全
 */

import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Share2 } from 'lucide-react';
import type { PollData, BestDate } from '@/lib/types';
import { formatDate } from '@/lib/date-utils';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';
const I18N = {
  ja: {
    name: '名前',
    result: (n: number) => `回答結果（${n}名）`,
    share: '共有',
    best: '最適日',
    ok: '○',
    ng: '×',
    people: (n: number) => `${n}名`,
    shareAria: '結果を共有',
    userCountAria: '回答人数',
  },
  en: {
    name: 'Name',
    result: (n: number) => `Results (${n} people)`,
    share: 'Share',
    best: 'Best',
    ok: 'Yes',
    ng: 'No',
    people: (n: number) => `${n} people`,
    shareAria: 'Share results',
    userCountAria: 'Respondents',
  },
} as const;

// --- 回答テーブルprops型（拡張・国際化） ---
export interface ResultsTableProps {
  pollData: PollData;
  bestDates: BestDate[];
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
  onShare: () => void;
  language?: Lang;
  renderDateLabel?: (date: string, language?: Lang) => React.ReactNode;
}

// --- dates配列から有効日付のみ抽出 ---
const getValidDates = (dates: string[]): string[] =>
  dates.filter(d => !!d && d.trim().length > 0);

// --- 各日付の出席可能人数集計 ---
const getDateSummary = (pollData: PollData, dateIdx: number) => ({
  available: pollData.users.reduce(
    (sum, user) => sum + (user.answers[dateIdx] === '○' ? 1 : 0),
    0
  ),
});

// --- 回答行コンポーネント（ユーザー単位で責務分離） ---
interface ResultsTableRowProps {
  user: PollData['users'][number];
  userIndex: number;
  dateCount: number;
  onToggleAnswer: (userIndex: number, dateIndex: number) => void;
  allOkColumns: boolean[];
  t: typeof I18N[Lang];
}
const ResultsTableRow = memo(function ResultsTableRow({
  user,
  userIndex,
  dateCount,
  onToggleAnswer,
  allOkColumns,
  t,
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
              answer === t.ok
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            aria-label={`${user.name} ${dateIndex + 1}: ${answer}`}
            type="button"
          >
            {answer}
          </Button>
        </td>
      ))}
    </tr>
  );
});

// --- ヘッダー（日付・人数・最適日ラベル） ---
interface ResultsTableHeaderProps {
  validDates: string[];
  pollData: PollData;
  bestDates: BestDate[];
  t: typeof I18N[Lang];
  renderDateLabel?: (date: string, language?: Lang) => React.ReactNode;
  language: Lang;
}
const ResultsTableHeader = memo(function ResultsTableHeader({
  validDates,
  pollData,
  bestDates,
  t,
  renderDateLabel,
  language,
}: ResultsTableHeaderProps) {
  return (
    <tr className="border-b border-gray-100">
      <th className="text-left py-3 px-2 font-medium text-gray-700 min-w-[100px]">
        {t.name}
      </th>
      {validDates.map((date: string, idx: number) => {
        const { available } = getDateSummary(pollData, idx);
        const isBest = bestDates.some((best: BestDate) => best.index === idx);
        return (
          <th
            key={date}
            className={`text-center py-3 px-2 font-medium text-gray-700 min-w-[80px] ${isBest ? 'bg-green-50' : ''}`}
            aria-label={isBest ? t.best : undefined}
          >
            <div className="space-y-1">
              <div className="text-xs">
                {renderDateLabel
                  ? renderDateLabel(date, language)
                  : formatDate(date)}
              </div>
              <div className="text-xs text-gray-500">{t.people(available)}</div>
            </div>
          </th>
        );
      })}
    </tr>
  );
});

/**
 * ResultsTable
 * - シンプルな○×集計テーブル
 * - 国際化・アクセシビリティ・型安全・再利用性・全観点最適化
 */
export const ResultsTable = memo(function ResultsTable({
  pollData,
  bestDates,
  onToggleAnswer,
  onShare,
  language = 'ja',
  renderDateLabel,
}: ResultsTableProps) {
  const t = I18N[language];
  // 有効日付抽出
  const validDates = useMemo(() => getValidDates(pollData.dates || []), [pollData.dates]);
  if (!pollData.users.length || !validDates.length) return null;

  // 全員○の列を判定
  const allOkColumns = useMemo(
    () =>
      validDates.map((_, dateIdx) =>
        pollData.users.every(user => user.answers[dateIdx] === t.ok)
      ),
    [validDates, pollData.users, t.ok]
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" aria-label={t.userCountAria} />
            <span className="font-medium text-gray-900">
              {t.result(pollData.users.length)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="border-gray-200 text-gray-600 hover:text-gray-900"
            aria-label={t.shareAria}
            type="button"
          >
            <Share2 className="h-4 w-4 mr-1" />
            {t.share}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <ResultsTableHeader
                validDates={validDates}
                pollData={pollData}
                bestDates={bestDates}
                t={t}
                renderDateLabel={renderDateLabel}
                language={language}
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
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
