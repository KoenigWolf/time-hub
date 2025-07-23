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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Typography } from '@/components/ui/typography'; // なければコメント化
// import { Alert } from '@/components/ui/alert'; // なければコメント化

const TimeHubApp = memo(function TimeHubApp() {
  const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
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

  const bestDateTimes = getBestDateTimes(pollData);
  const hasCandidates = hasValidCandidates(pollData.candidates);
  const isCreated = hasCandidates && pollData.title;

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleGoToTop(e);
      }
    },
    [handleGoToTop]
  );

  const handleCreationComplete = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleBackToEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onGoToTop={handleGoToTop} onKeyDown={handleKeyDown} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6">
        {(!isCreated || isEditing) && (
          <EventCreationWizard
            title={pollData.title}
            candidates={pollData.candidates}
            onTitleChange={handleTitleChange}
            onCandidatesChange={handleCandidatesChange}
            onComplete={handleCreationComplete}
          />
        )}
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

/** --- Header --- */
interface HeaderProps {
  onGoToTop: (e: MouseEvent | KeyboardEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}
const Header = memo(function Header({ onGoToTop, onKeyDown }: HeaderProps) {
  return (
    <header>
      <Card className="rounded-none border-b-0 shadow-none bg-white sticky top-0 z-20">
        <CardContent className="flex flex-col items-center justify-center py-3">
          <Link
            href="/"
            onClick={onGoToTop}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="button"
            aria-label="トップページに戻る"
            data-testid="logo-link"
          >
            {/* Typographyコンポーネントがあれば下記に変更 */}
            {/* <Typography variant="h1" className="tracking-wide font-light">time-hub</Typography> */}
            <span className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide hover:text-blue-600 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1">
              time-hub
            </span>
          </Link>
          {/* <Typography variant="subtitle2" color="textSecondary">シンプルな日程調整</Typography> */}
          <span className="text-gray-500 font-light text-xs sm:text-sm mt-1">
            シンプルな日程調整
          </span>
        </CardContent>
      </Card>
    </header>
  );
});

/** --- Footer --- */
const Footer = memo(function Footer() {
  return (
    <footer>
      <Card className="rounded-none border-t-0 shadow-none bg-white">
        <CardContent className="flex items-center justify-center py-2 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} time-hub</span>
        </CardContent>
      </Card>
    </footer>
  );
});

/** --- イベント作成後のUI --- */
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
      <section>
        <Card>
          <CardContent className="text-center space-y-3 py-6">
            {/* <Typography variant="h2" className="font-medium"> */}
            <h2 className="text-2xl font-medium text-gray-900">{pollData.title}</h2>
            {/* </Typography> */}
            {/* <Typography color="textSecondary"> */}
            <p className="text-gray-600">
              以下の候補日時から都合の良い時間を選択してください
            </p>
            {/* </Typography> */}
            {pollData.candidates.length > 0 && (
              <div className="flex justify-center">
                {/* Alert や Badge で置換可 */}
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                  候補日: {pollData.candidates.length}日 ・
                  候補時間: {pollData.candidates.reduce((sum, c) => sum + c.timeSlots.length, 0)}件
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={onBackToEdit}
          variant="secondary"
          size="lg"
          aria-label="日程選択ページに戻る"
          data-testid="back-to-edit-btn"
        >
          日程選択に戻る
        </Button>
      </div>

      <DateTimeAnswerForm
        candidates={pollData.candidates}
        onSubmit={submitAnswer}
      />
      <DateTimeResultsTable
        pollData={pollData}
        bestDateTimes={bestDateTimes}
        onToggleAnswer={toggleExistingAnswer}
        onShare={onShareDialogOpen}
      />
    </div>
  );
});
