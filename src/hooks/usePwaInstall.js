import { useCallback, useEffect, useRef, useState } from 'react';

const DISMISS_KEY = 'c2v_install_dismissed_at';
const DISMISS_DAYS = 14;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isStandalone() {
  if (!isBrowser()) return false;
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    // matchMedia unsupported
  }
  return navigator.standalone === true;
}

function readDismissedAt() {
  if (!isBrowser()) return 0;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeDismissedAt(timestamp) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(timestamp));
  } catch {
    // storage blocked (private mode / quota)
  }
}

function isDismissedNow() {
  const dismissedAt = readDismissedAt();
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < DISMISS_MS;
}

// iPadOS 13+ reports a desktop macOS user agent, so touch points are the tell.
function detectIosManual() {
  if (!isBrowser() || isStandalone()) return false;
  const ua = navigator.userAgent || '';
  const isIosUa = /iphone|ipad|ipod/i.test(ua);
  const isIpadOs = /macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  if (!isIosUa && !isIpadOs) return false;
  // iOS Chrome/Firefox/Edge/Opera cannot install a PWA, so only offer the manual hint in Safari.
  return !/(crios|fxios|edgios|opios)/i.test(ua);
}

export function usePwaInstall() {
  const deferredEvent = useRef(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());
  const [isIosManual, setIsIosManual] = useState(() => detectIosManual());
  const [isDismissed, setIsDismissed] = useState(() => isDismissedNow());

  useEffect(() => {
    if (!isBrowser()) return undefined;

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredEvent.current = event;
      setCanPrompt(true);
    };

    const onAppInstalled = () => {
      deferredEvent.current = null;
      setCanPrompt(false);
      setIsInstalled(true);
      setIsIosManual(false);
    };

    let mediaQuery = null;
    const onDisplayModeChange = (event) => {
      if (event.matches) {
        deferredEvent.current = null;
        setCanPrompt(false);
        setIsInstalled(true);
        setIsIosManual(false);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    try {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onDisplayModeChange);
      else if (mediaQuery.addListener) mediaQuery.addListener(onDisplayModeChange);
    } catch {
      mediaQuery = null;
    }

    // The event can fire between first render and this effect on fast loads.
    if (isStandalone()) setIsInstalled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      try {
        if (!mediaQuery) return;
        if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', onDisplayModeChange);
        else if (mediaQuery.removeListener) mediaQuery.removeListener(onDisplayModeChange);
      } catch {
        // ignore
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const event = deferredEvent.current;
    if (!event) return 'dismissed';

    let outcome = 'dismissed';
    try {
      event.prompt();
      const choice = await event.userChoice;
      outcome = choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch {
      outcome = 'dismissed';
    } finally {
      deferredEvent.current = null;
      setCanPrompt(false);
    }
    return outcome;
  }, []);

  const dismiss = useCallback(() => {
    writeDismissedAt(Date.now());
    setIsDismissed(true);
  }, []);

  return {
    canPrompt,
    isInstalled,
    isIosManual,
    isDismissed,
    promptInstall,
    dismiss,
  };
}

export default usePwaInstall;
