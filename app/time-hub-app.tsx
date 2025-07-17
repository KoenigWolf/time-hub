'use client';

import { useState, memo, useCallback, MouseEvent, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePollData } from '@/hooks/use-poll-data';
import { getBestDateTimes, hasValidCandidates } from '@/lib/poll-utils';
import { PollShareDialog } from '@/components/poll-share-dialog';
import { EventCreationWizard } from '@/components/event-creation-wizard';
import { DateTimeAnswerForm } from '@/components/datetime-answer-form';
import { DateTimeResultsTable } from '@/components/datetime-results-table';

/**
 * TimeHubApp: 日程調整アプリのエントリーポイント
 * - 責務分離：各表示UI・イベントロジックを関数で分離
 * - 可読性・保守性：詳細コメント付与、関数化で論理単位を明確化
 * - 拡張性・型安全性：Props型やユーティリティ型で将来対応しやすく
 * - アクセシビリティ：role/aria属性付与・tabIndex明示
 * - テスト容易性：要素にdata-testidを付与しやすい設計
 */
const TimeHubApp = memo(function TimeHubApp() {
  // --- State ---
  const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // 追加: 編集モード管理
  const router = useRouter();

  // --- Custom Hooks ---
  const {
    pollData,
    mounted,
    handleTitleChange,
    handleCandidatesChange,
    submitAnswer,
    toggleExistingAnswer,
    getShareUrl,
  } = usePollData();

  // --- Utility values ---
  const bestDateTimes = getBestDateTimes(pollData);
  const hasCandidates = hasValidCandidates(pollData.candidates);
  const isCreated = hasCandidates && pollData.title;

  // --- UIイベントハンドラ ---
  /** トップページへ安全に遷移する */
  const handleGoToTop = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      e.preventDefault();
      router.push('/');
      setTimeout(() => {
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }, 100);
    },
    [router]
  );

  /** Enter/Space対応のキーボードハンドラ */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleGoToTop(e);
      }
    },
    [handleGoToTop]
  );

  /** イベント作成完了時のコールバック（拡張用） */
  const handleCreationComplete = useCallback(() => {
    setIsEditing(false); // 編集完了で結果表示へ
  }, []);

  /** 日程選択ページに戻る */
  const handleBackToEdit = useCallback(() => {
    setIsEditing(true); // 編集モードに戻す
  }, []);

  // --- SSR対策：初回マウント前は描画しない ---
  if (!mounted) return null;

  // --- UI分割（JSX返却） ---
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onGoToTop={handleGoToTop} onKeyDown={handleKeyDown} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6">
        {/* イベント作成フェーズ */}
        {(!isCreated || isEditing) && (
          <EventCreationWizard
            title={pollData.title}
            candidates={pollData.candidates}
            onTitleChange={handleTitleChange}
            onCandidatesChange={handleCandidatesChange}
            onComplete={handleCreationComplete}
          />
        )}
        {/* イベント作成後フェーズ */}
        {isCreated && !isEditing && (
          <EventCreatedView
            pollData={pollData}
            bestDateTimes={bestDateTimes}
            onBackToEdit={handleBackToEdit}
            submitAnswer={submitAnswer}
            toggleExistingAnswer={toggleExistingAnswer}
            onShareDialogOpen={() => setShareDialogOpen(true)}
          />
        )}
      </main>
      <Footer />
      {/* 共有ダイアログ */}
      <PollShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        url={getShareUrl()}
        title={pollData.title}
      />
    </div>
  );
});

export default TimeHubApp;

/**
 * ヘッダー部（ロゴ・サブタイトル）
 */
interface HeaderProps {
  onGoToTop: (e: MouseEvent | KeyboardEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}
const Header = memo(function Header({ onGoToTop, onKeyDown }: HeaderProps) {
  return (
    <header className="w-full flex flex-col items-center justify-center py-2 sm:py-3 md:py-4 border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
      <Link
        href="/"
        onClick={onGoToTop}
        onKeyDown={onKeyDown}
        className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide hover:text-blue-600 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
        tabIndex={0}
        role="button"
        aria-label="トップページに戻る"
        data-testid="logo-link"
      >
        time-hub
      </Link>
      <p className="text-gray-500 font-light text-xs sm:text-sm mt-1">シンプルな日程調整</p>
    </header>
  );
});

/**
 * フッター部
 */
const Footer = memo(function Footer() {
  return (
    <footer className="w-full flex items-center justify-center py-2 sm:py-3 md:py-4 border-t border-gray-100 bg-white text-xs text-gray-400 select-none">
      <span>&copy; {new Date().getFullYear()} time-hub</span>
    </footer>
  );
});

/**
 * イベント作成後画面の集約UI
 */
interface EventCreatedViewProps {
  pollData: ReturnType<typeof usePollData>['pollData'];
  bestDateTimes: ReturnType<typeof getBestDateTimes>;
  onBackToEdit: () => void;
  submitAnswer: (userName: string, answers: any) => void;
  toggleExistingAnswer: (userIdx: number, flatIndex: number) => void;
  onShareDialogOpen: () => void;
}
const EventCreatedView = memo(function EventCreatedView({
  pollData,
  bestDateTimes,
  onBackToEdit,
  submitAnswer,
  toggleExistingAnswer,
  onShareDialogOpen,
}: EventCreatedViewProps) {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 py-6 border-b border-gray-100">
        <h2 className="text-2xl font-medium text-gray-900">{pollData.title}</h2>
        <p className="text-gray-600">
          以下の候補日時から都合の良い時間を選択してください
        </p>
        {pollData.candidates.length > 0 && (
          <div className="flex justify-center">
            <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              候補日: {pollData.candidates.length}日 ・
              候補時間: {pollData.candidates.reduce((sum, c) => sum + c.timeSlots.length, 0)}件
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          onClick={onBackToEdit}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium shadow-sm"
          type="button"
          aria-label="日程選択ページに戻る"
          data-testid="back-to-edit-btn"
        >
          日程選択に戻る
        </button>
      </div>

      <DateTimeAnswerForm
        candidates={pollData.candidates}
        onSubmit={(userName, answers) => submitAnswer(userName, answers)}
      />
      <DateTimeResultsTable
        pollData={pollData}
        bestDateTimes={bestDateTimes}
        onToggleAnswer={(userIdx, flatIndex) => toggleExistingAnswer(userIdx, flatIndex)}
        onShare={onShareDialogOpen}
      />
    </div>
  );
});
