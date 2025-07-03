'use client';

import { useState, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Share2, Check } from 'lucide-react';

interface PollShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const useCopyToClipboard = (text: string, resetMs = 2000) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text, resetMs]);
  return { copied, handleCopy };
};

const ShareUrlRow = memo(function ShareUrlRow({
  url,
  copied,
  onCopy,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">共有用URL</label>
      <div className="flex gap-2">
        <Input
          value={url}
          readOnly
          className="text-xs"
          onClick={e => e.currentTarget.select()}
          aria-label="共有URL"
        />
        <Button
          onClick={onCopy}
          variant="outline"
          size="sm"
          className="min-w-[80px]"
          aria-label="URLをコピー"
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              完了
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

const useNativeShare = (url: string, title: string, fallback: () => Promise<void>) =>
  useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `日程調整: ${title}`,
          text: `「${title}」の日程調整にご回答ください`,
          url,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to share:', error);
          await fallback();
        }
      }
    } else {
      await fallback();
    }
  }, [url, title, fallback]);

/** LINE・メール共有用URL生成ロジック */
const getLineShareUrl = (url: string, title: string) =>
  `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`「${title}」の日程調整にご回答ください`)}`;
const getMailShareUrl = (url: string, title: string) =>
  `mailto:?subject=${encodeURIComponent(`日程調整: ${title}`)}&body=${encodeURIComponent(`「${title}」の日程調整にご回答ください\n\n${url}`)}`;

const ShareButtonList = memo(function ShareButtonList({
  url,
  title,
  onNativeShare,
  shareText,
}: {
  url: string;
  title: string;
  onNativeShare: () => void;
  shareText: string;
}) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onNativeShare}
        className="w-full h-12 text-base font-semibold"
        size="lg"
        type="button"
        aria-label="共有"
      >
        <Share2 className="h-4 w-4 mr-2" />
        {typeof navigator !== 'undefined' && 'share' in navigator ? '共有' : 'URLをコピー'}
      </Button>
      <Button
        variant="outline"
        onClick={() => window.open(getLineShareUrl(url, title), '_blank')}
        className="w-full h-12 text-base font-semibold bg-green-500 hover:bg-green-600 text-white border-green-500"
        aria-label="LINEで送る"
        type="button"
      >
        LINEで送る
      </Button>
      <Button
        variant="outline"
        onClick={() => (window.location.href = getMailShareUrl(url, title))}
        className="w-full h-12 text-base"
        aria-label="メールで送る"
        type="button"
      >
        メールで送る
      </Button>
    </div>
  );
});

/** 使い方説明リスト（再利用可能） */
const HowToUse = memo(function HowToUse() {
  return (
    <div className="text-xs text-muted-foreground space-y-2">
      <p className="font-medium">使い方：</p>
      <ul className="space-y-1 list-disc list-inside ml-2">
        <li>上記URLを参加者に共有してください</li>
        <li>参加者は表で名前と○×を入力できます</li>
        <li>回答は即座に反映されます</li>
        <li>最適な候補日が自動で表示されます</li>
      </ul>
    </div>
  );
});

/** メインダイアログ */
export function PollShareDialog({
  isOpen,
  onClose,
  url,
  title,
}: PollShareDialogProps) {
  const { copied, handleCopy } = useCopyToClipboard(url);
  const shareText = `「${title}」の日程調整にご回答ください\n\n${url}`;
  const handleNativeShare = useNativeShare(url, title, async () => handleCopy());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            日程調整を共有
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <ShareUrlRow url={url} copied={copied} onCopy={handleCopy} />
          <ShareButtonList
            url={url}
            title={title}
            onNativeShare={handleNativeShare}
            shareText={shareText}
          />
          <HowToUse />
        </div>
      </DialogContent>
    </Dialog>
  );
}
