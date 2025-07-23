'use client';

/**
 * PollShareDialog
 * - 日程調整のURL/共有ダイアログ
 * - 国際化・アクセシビリティ・拡張性・全観点最適化
 */

import { useState, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Share2, Check } from 'lucide-react';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';
const I18N = {
  ja: {
    dialogTitle: '日程調整を共有',
    urlLabel: '共有用URL',
    copy: 'コピー',
    copyDone: '完了',
    share: '共有',
    shareByLine: 'LINEで送る',
    shareByMail: 'メールで送る',
    howto: [
      '上記URLを参加者に共有してください',
      '参加者は表で名前と○×を入力できます',
      '回答は即座に反映されます',
      '最適な候補日が自動で表示されます',
    ],
    howtoTitle: '使い方：',
    copiedAria: 'URLコピー完了',
    shareAria: '共有',
    lineAria: 'LINEで共有',
    mailAria: 'メールで共有',
    urlAria: '共有URL',
  },
  en: {
    dialogTitle: 'Share Poll Link',
    urlLabel: 'Shareable URL',
    copy: 'Copy',
    copyDone: 'Copied!',
    share: 'Share',
    shareByLine: 'Share on LINE',
    shareByMail: 'Share by Email',
    howto: [
      'Share the URL above with participants.',
      'Participants can enter their name and answers.',
      'Responses are reflected instantly.',
      'Best dates will be highlighted automatically.',
    ],
    howtoTitle: 'How to use:',
    copiedAria: 'URL copied',
    shareAria: 'Share',
    lineAria: 'Share via LINE',
    mailAria: 'Share via Email',
    urlAria: 'Share URL',
  },
} as const;

// --- props型 ---
export interface PollShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  language?: Lang;
}

/**
 * useCopyToClipboard
 * - 汎用クリップボードコピー管理フック
 */
function useCopyToClipboard(text: string, resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch (error) {
      // エラーはログのみ（ユーザーには非表示）
      // アクセシビリティ考慮ならトースト追加も可
      console.error('Failed to copy:', error);
    }
  }, [text, resetMs]);
  return { copied, handleCopy };
}

/**
 * useNativeShare
 * - Web Share API or fallback
 */
function useNativeShare(
  url: string,
  title: string,
  language: Lang,
  fallback: () => Promise<void>
) {
  const t = I18N[language];
  return useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${t.dialogTitle}: ${title}`,
          text: `${title}\n${url}`,
          url,
        });
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          await fallback();
        }
      }
    } else {
      await fallback();
    }
  }, [url, title, fallback, t.dialogTitle]);
}

/** LINE・メール共有URL生成 */
const getLineShareUrl = (url: string, title: string) =>
  `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}`)}`;
const getMailShareUrl = (url: string, title: string) =>
  `mailto:?subject=${encodeURIComponent(`${title}`)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;

/**
 * ShareUrlRow
 * - URLのコピーユニット
 */
const ShareUrlRow = memo(function ShareUrlRow({
  url,
  copied,
  onCopy,
  t,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  t: typeof I18N[Lang];
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{t.urlLabel}</label>
      <div className="flex gap-2">
        <Input
          value={url}
          readOnly
          className="text-xs"
          onClick={e => e.currentTarget.select()}
          aria-label={t.urlAria}
        />
        <Button
          onClick={onCopy}
          variant="outline"
          size="sm"
          className="min-w-[80px]"
          aria-label={t.copy}
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              {t.copyDone}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              {t.copy}
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

/**
 * ShareButtonList
 * - ネイティブシェア、LINE、メールの選択UI
 */
const ShareButtonList = memo(function ShareButtonList({
  url,
  title,
  onNativeShare,
  t,
}: {
  url: string;
  title: string;
  onNativeShare: () => void;
  t: typeof I18N[Lang];
}) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onNativeShare}
        className="w-full h-12 text-base font-semibold"
        size="lg"
        type="button"
        aria-label={t.shareAria}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {typeof navigator !== 'undefined' && 'share' in navigator ? t.share : t.copy}
      </Button>
      <Button
        variant="outline"
        onClick={() => window.open(getLineShareUrl(url, title), '_blank', 'noopener')}
        className="w-full h-12 text-base font-semibold bg-green-500 hover:bg-green-600 text-white border-green-500"
        aria-label={t.lineAria}
        type="button"
      >
        LINE
      </Button>
      <Button
        variant="outline"
        onClick={() => window.open(getMailShareUrl(url, title), '_blank', 'noopener')}
        className="w-full h-12 text-base font-semibold"
        aria-label={t.mailAria}
        type="button"
      >
        {t.shareByMail}
      </Button>
    </div>
  );
});

/**
 * HowToUse
 * - 利用ガイドUI
 */
const HowToUse = memo(function HowToUse({ t }: { t: typeof I18N[Lang] }) {
  return (
    <div className="text-xs text-muted-foreground space-y-2">
      <p className="font-medium">{t.howtoTitle}</p>
      <ul className="space-y-1 list-disc list-inside ml-2">
        {t.howto.map((txt, idx) => (
          <li key={idx}>{txt}</li>
        ))}
      </ul>
    </div>
  );
});

/**
 * PollShareDialog
 * - 本体。props分離・国際化・アクセシビリティ・再利用性配慮
 */
export function PollShareDialog({
  isOpen,
  onClose,
  url,
  title,
  language = 'ja',
}: PollShareDialogProps) {
  const t = I18N[language];
  const { copied, handleCopy } = useCopyToClipboard(url);
  const handleNativeShare = useNativeShare(url, title, language, async () => handleCopy());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">{t.dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <ShareUrlRow url={url} copied={copied} onCopy={handleCopy} t={t} />
          <ShareButtonList url={url} title={title} onNativeShare={handleNativeShare} t={t} />
          <HowToUse t={t} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
