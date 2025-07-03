'use client';

import { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePollData } from '@/hooks/use-poll-data';
import { getBestDateTimes, hasValidCandidates } from '@/lib/poll-utils';
import { PollShareDialog } from '@/components/poll-share-dialog';
import { EventCreationWizard } from '@/components/event-creation-wizard';
import { DateTimeAnswerForm } from '@/components/datetime-answer-form';
import { DateTimeResultsTable } from '@/components/datetime-results-table';
import { EmptyState } from '@/components/empty-state';

/** time-hub メインアプリ本体 */
const TimeHubApp = memo(function TimeHubApp() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isCreationMode, setIsCreationMode] = useState(false);
  const router = useRouter();
  
  const {
    pollData,
    mounted,
    handleTitleChange,
    handleCandidatesChange,
    submitAnswer,
    toggleExistingAnswer,
    getShareUrl,
  } = usePollData();

  // イベント作成完了時の処理
  const handleCreationComplete = useCallback(() => {
    setIsCreationMode(false);
  }, []);

  // 新規作成モードの開始
  const handleStartCreation = useCallback(() => {
    setIsCreationMode(true);
  }, []);

  // トップページへの確実な遷移処理
  const handleGoToTop = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    console.log('Navigating to top page...');
    
    // 現在のURLをログ出力
    console.log('Current path:', window.location.pathname);
    
    // 強制的にトップページに遷移
    router.push('/');
    
    // フォールバック: window.locationも使用
    setTimeout(() => {
      console.log('Checking navigation result:', window.location.pathname);
      if (window.location.pathname !== '/') {
        console.log('Router.push failed, using window.location...');
        window.location.href = '/';
      }
    }, 100);
  }, [router]);

  // キーボードイベント用のハンドラ
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleGoToTop(e);
    }
  }, [handleGoToTop]);

  // 計算された値（フック呼び出し後）
  const bestDateTimes = getBestDateTimes(pollData);
  const hasCandidates = hasValidCandidates(pollData.candidates);
  const showEmptyState = pollData.users.length === 0 && !hasCandidates && !pollData.title;
  const isCreated = hasCandidates && pollData.title;

  // SSR対策: 初回マウント前は何も表示しない（フック呼び出し後の早期return）
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* ヘッダー */}
        <header className="text-center space-y-4 py-8">
          <Link 
            href="/" 
            onClick={handleGoToTop}
            onKeyDown={handleKeyDown}
            className="inline-block text-3xl font-light text-gray-900 tracking-wide hover:text-blue-600 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            tabIndex={0}
            role="button"
            aria-label="トップページに戻る"
          >
            time-hub
          </Link>
          <p className="text-gray-500 font-light">シンプルな日程調整</p>
        </header>

        {/* 1. イベント作成フロー */}
        {(isCreationMode || (!isCreated && !showEmptyState)) && (
          <EventCreationWizard
            title={pollData.title}
            candidates={pollData.candidates}
            onTitleChange={handleTitleChange}
            onCandidatesChange={handleCandidatesChange}
            onComplete={handleCreationComplete}
          />
        )}

        {/* 2. 作成完了後の表示 */}
        {isCreated && !isCreationMode && (
          <div className="space-y-8">
            {/* イベント情報表示 */}
            <div className="text-center space-y-3 py-6 border-b border-gray-100">
              <h2 className="text-2xl font-medium text-gray-900">
                {pollData.title}
              </h2>
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
            </div>

            {/* 3. 回答入力フォーム */}
            <DateTimeAnswerForm
              candidates={pollData.candidates}
              onSubmit={submitAnswer}
            />

            {/* 4. 集計結果表示 */}
            <DateTimeResultsTable
              pollData={pollData}
              bestDateTimes={bestDateTimes}
              onToggleAnswer={toggleExistingAnswer}
              onShare={() => setShareDialogOpen(true)}
            />
          </div>
        )}

        {/* 5. 初期状態のガイド */}
        {showEmptyState && (
          <div className="space-y-6">
            <EmptyState />
            <div className="text-center">
              <button
                onClick={handleStartCreation}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                新しい日程調整を作成
              </button>
            </div>
          </div>
        )}
      </div>

      {/* URL共有ダイアログ */}
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
