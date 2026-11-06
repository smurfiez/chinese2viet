import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { UI_TRANSLATIONS } from '../data/translations.js';
import { usePwaInstall } from '../hooks/usePwaInstall.js';

const SHOW_DELAY_MS = 2500;

export default function InstallPrompt({ t = UI_TRANSLATIONS.vi }) {
  const { canPrompt, isInstalled, isIosManual, isDismissed, promptInstall, dismiss } = usePwaInstall();

  const [ready, setReady] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [busy, setBusy] = useState(false);
  const primaryRef = useRef(null);

  const supported = canPrompt || isIosManual;
  const visible = ready && supported && !isInstalled && !isDismissed;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    let timer = 0;
    const arm = () => {
      if (timer !== 0 || document.visibilityState !== 'visible') return;
      timer = window.setTimeout(() => {
        timer = -1;
        setReady(true);
      }, SHOW_DELAY_MS);
    };

    arm();
    document.addEventListener('visibilitychange', arm);

    return () => {
      if (timer > 0) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', arm);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    primaryRef.current?.focus({ preventScroll: true });
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setShowSteps(false);
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    if (!visible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, handleDismiss]);

  const handlePrimary = async () => {
    if (isIosManual) {
      setShowSteps((value) => !value);
      return;
    }
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome !== 'accepted') handleDismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-live="polite"
      aria-labelledby="install-prompt-title"
      className="fixed inset-x-0 bottom-0 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] animate-fade-in sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm sm:pb-0"
    >
      <div className="mx-3 mb-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:mx-0 sm:mb-0">
        <div className="flex items-start gap-3">
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt=""
            width="44"
            height="44"
            className="h-11 w-11 shrink-0 rounded-xl border border-slate-200"
          />
          <div className="min-w-0 flex-1">
            <h2 id="install-prompt-title" className="text-sm font-bold text-slate-900">
              {t.installTitle}
            </h2>
            <p className="mt-0.5 text-xs leading-snug text-slate-600">{t.installBody}</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t.installClose}
            className="-mr-1 -mt-1 inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          ref={primaryRef}
          type="button"
          onClick={handlePrimary}
          disabled={busy}
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60"
        >
          {isIosManual ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          <span>{isIosManual ? t.installIosButton : t.installButton}</span>
        </button>

        {isIosManual && showSteps && (
          <>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-snug text-slate-700">
              <li>{t.installIosStep1}</li>
              <li>{t.installIosStep2}</li>
              <li>{t.installIosStep3}</li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-400">{t.installIosNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
