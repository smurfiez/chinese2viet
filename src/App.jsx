import React, { useState, useMemo, useCallback } from 'react';
import * as OpenCC from 'opencc-js';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Languages,
  HelpCircle,
  Clipboard,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  LayoutGrid,
  Table,
  Trash2,
  Globe,
} from 'lucide-react';
import { convertChineseToVietnamese } from './utils/converter.js';
import {
  speakChinese,
  speakVietnamese,
  stopSpeech,
  isSpeechSupported,
} from './utils/speech.js';
import { UI_TRANSLATIONS } from './data/translations.js';
import InstallPrompt from './components/InstallPrompt.jsx';

// OpenCC converters
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'hk' });
const t2sConverter = OpenCC.Converter({ from: 'hk', to: 'cn' });

export default function App() {
  const [uiLang, setUiLang] = useState(() => {
    try {
      const saved = localStorage.getItem('chinese2viet_lang');
      if (saved === 'vi' || saved === 'en') return saved;
      if (typeof navigator !== 'undefined' && navigator.language) {
        return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const t = UI_TRANSLATIONS[uiLang] || UI_TRANSLATIONS.vi;

  const handleLanguageChange = (lang) => {
    setUiLang(lang);
    try {
      localStorage.setItem('chinese2viet_lang', lang);
    } catch {
      // ignore
    }
  };

  const [inputText, setInputText] = useState('你好，很高兴认识你！今天天气真好。');
  const [activeTab, setActiveTab] = useState('fulltext'); // 'fulltext' | 'ruby' | 'comparative'
  const [isTraditional, setIsTraditional] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [speakingState, setSpeakingState] = useState({ active: false, type: null, id: null });
  const [copiedKey, setCopiedKey] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Conversion result
  const result = useMemo(() => {
    return convertChineseToVietnamese(inputText);
  }, [inputText]);

  // Chinese character count stats
  const stats = useMemo(() => {
    const chars = inputText.length;
    const chineseChars = (inputText.match(/[\u4e00-\u9fa5]/g) || []).length;
    return { chars, chineseChars };
  }, [inputText]);

  // Toast notification
  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2200);
  }, []);

  // Copy helper
  const handleCopy = useCallback(
    (text, key) => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        triggerToast(t.copiedToast);
        setTimeout(() => setCopiedKey(null), 1800);
      });
    },
    [t.copiedToast, triggerToast]
  );

  // Paste helper
  const handlePaste = useCallback(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((clipText) => {
        if (clipText) {
          setInputText(clipText);
          triggerToast(t.pastedToast);
        }
      });
    }
  }, [t.pastedToast, triggerToast]);

  // Clear helper
  const handleClear = useCallback(() => {
    setInputText('');
    stopSpeech();
    setSpeakingState({ active: false, type: null, id: null });
  }, []);

  // Toggle Simplified / Traditional
  const handleToggleScript = useCallback(() => {
    if (isTraditional) {
      const simplified = t2sConverter(inputText);
      setInputText(simplified);
      setIsTraditional(false);
      triggerToast(t.switchedToSimp);
    } else {
      const traditional = s2tConverter(inputText);
      setInputText(traditional);
      setIsTraditional(true);
      triggerToast(t.switchedToTrad);
    }
  }, [isTraditional, inputText, t.switchedToSimp, t.switchedToTrad, triggerToast]);

  // Audio Playback
  const handleSpeakChinese = useCallback(
    (textToSpeak = inputText, id = 'main-zh') => {
      if (!textToSpeak.trim()) return;
      setSpeakingState({ active: true, type: 'zh', id });
      speakChinese(textToSpeak, {
        onEnd: () => setSpeakingState({ active: false, type: null, id: null }),
        onError: () => setSpeakingState({ active: false, type: null, id: null }),
      });
    },
    [inputText]
  );

  const handleSpeakVietnamese = useCallback(
    (textToSpeak, id = 'main-vi') => {
      if (!textToSpeak || !textToSpeak.trim()) return;
      setSpeakingState({ active: true, type: 'vi', id });
      speakVietnamese(textToSpeak, {
        onEnd: () => setSpeakingState({ active: false, type: null, id: null }),
        onError: () => setSpeakingState({ active: false, type: null, id: null }),
      });
    },
    []
  );

  const handleStopSpeech = useCallback(() => {
    stopSpeech();
    setSpeakingState({ active: false, type: null, id: null });
  }, []);

  // Language Switcher Component
  const renderLanguageSwitcher = (isMobile = false) => (
    <div
      className={`flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 ${
        isMobile ? 'md:hidden' : 'hidden md:flex'
      }`}
    >
      <button
        onClick={() => handleLanguageChange('vi')}
        className={`min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-lg transition-all flex items-center gap-1 active:scale-95 ${
          uiLang === 'vi'
            ? 'bg-white text-indigo-700 shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Giao diện Tiếng Việt"
        aria-label="Giao diện Tiếng Việt"
      >
        <span>🇻🇳</span>
        <span className="sm:hidden">VN</span>
        <span className="hidden sm:inline">Tiếng Việt</span>
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-lg transition-all flex items-center gap-1 active:scale-95 ${
          uiLang === 'en'
            ? 'bg-white text-indigo-700 shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="English Interface"
        aria-label="English Interface"
      >
        <span>🇬🇧</span>
        <span className="sm:hidden">EN</span>
        <span className="hidden sm:inline">English</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm backdrop-blur-sm transition-all animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-app install hint (PWA) */}
      <InstallPrompt t={t} />

      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-xs pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
            {/* Top row on mobile: Brand identity & Mobile Language Switcher */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full md:w-auto min-w-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                      {t.appTitle}
                    </h1>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60 shrink-0">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              {/* Language Switcher on mobile (top-right next to title) */}
              {renderLanguageSwitcher(true)}
            </div>

            {/* Bottom row on mobile / Controls on desktop */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Language Switcher on desktop */}
              {renderLanguageSwitcher(false)}

              {speakingState.active ? (
                <button
                  onClick={handleStopSpeech}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs sm:text-sm font-semibold border border-rose-200 transition-all shadow-xs active:scale-[0.98] shrink-0"
                  title={t.stopSpeech}
                  aria-label={t.stopSpeech}
                >
                  <VolumeX className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                  <span>{t.stopSpeech}</span>
                </button>
              ) : null}

              <button
                onClick={() => handleSpeakChinese(inputText, 'header-zh')}
                disabled={!inputText.trim() || !isSpeechSupported()}
                className="min-h-[44px] flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shadow-indigo-200 active:scale-[0.98]"
                title={t.listenChinese}
                aria-label={t.listenChinese}
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{t.listenZhShort}</span>
                <span className="hidden sm:inline">{t.listenChinese}</span>
              </button>

              <button
                onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'header-vi')}
                disabled={!result.phoneticVietText || !isSpeechSupported()}
                className="min-h-[44px] flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shadow-emerald-200 active:scale-[0.98]"
                title={t.listenVietnamese}
                aria-label={t.listenVietnamese}
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{t.listenViShort}</span>
                <span className="hidden sm:inline">{t.listenVietnamese}</span>
              </button>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border active:scale-[0.98] shrink-0 ${
                  showGuide
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title={t.toneGuide}
                aria-label={t.toneGuide}
                aria-expanded={showGuide}
              >
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="hidden lg:inline">{t.toneGuide}</span>
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 shrink-0 py-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden xs:inline">{t.presetLabel}</span>
            </span>
            {t.presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(p.text);
                  setIsTraditional(false);
                }}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 min-h-[38px] sm:min-h-[32px] rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 active:text-indigo-800 text-slate-700 border border-slate-200 hover:border-indigo-200 transition-all active:scale-95 flex items-center"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Collapsible Tone & Pronunciation Guide */}
        {showGuide && (
          <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 sm:p-5 shadow-xs transition-all animate-fade-in">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-amber-200/60 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5 text-amber-700 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-amber-950 truncate">
                  {t.guideTitle}
                </h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-700 hover:text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors shrink-0"
                aria-label={t.close}
              >
                {t.close}
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs mb-3 sm:mb-4">
              {/* Tone 1 */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-indigo-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{t.tone1Title}</span>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs sm:text-sm flex items-center justify-center border border-indigo-200 shrink-0">
                      ā
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-none">{t.tone1Desc}</p>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs text-indigo-700 font-semibold bg-indigo-50/70 px-2 py-1 rounded-md border border-indigo-100">
                  {t.tone1Rule}
                </div>
              </div>

              {/* Tone 2 */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{t.tone2Title}</span>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs sm:text-sm flex items-center justify-center border border-emerald-200 shrink-0">
                      á
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-none">{t.tone2Desc}</p>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs text-emerald-700 font-semibold bg-emerald-50/70 px-2 py-1 rounded-md border border-emerald-100">
                  {t.tone2Rule}
                </div>
              </div>

              {/* Tone 3 */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{t.tone3Title}</span>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-800 font-mono font-bold text-xs sm:text-sm flex items-center justify-center border border-amber-200 shrink-0">
                      ǎ
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-none">{t.tone3Desc}</p>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs text-amber-800 font-semibold bg-amber-50/70 px-2 py-1 rounded-md border border-amber-200">
                  {t.tone3Rule}
                </div>
              </div>

              {/* Tone 4 */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-rose-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{t.tone4Title}</span>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-700 font-mono font-bold text-xs sm:text-sm flex items-center justify-center border border-rose-200 shrink-0">
                      à
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-none">{t.tone4Desc}</p>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs text-rose-700 font-semibold bg-rose-50/70 px-2 py-1 rounded-md border border-rose-100">
                  {t.tone4Rule}
                </div>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs text-amber-900 bg-amber-100/60 p-2.5 sm:p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <span className="font-bold">{t.guideNoteTitle}</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-700">
                  <li>{t.guideNote1}</li>
                  <li>{t.guideNote2}</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Dual-Pane Layout: Left Input, Right Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* LEFT PANE: Input Section */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="chinese-input" className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <span>{t.inputLabel}</span>
                {speakingState.active && speakingState.type === 'zh' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </label>

              {/* Script Toggle */}
              <button
                onClick={handleToggleScript}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium border border-slate-200 transition-all touch-manipulation active:scale-95 min-h-[40px] sm:min-h-0"
                title={isTraditional ? t.simplified : t.traditional}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isTraditional ? t.traditional : t.simplified}</span>
              </button>
            </div>

            {/* Main Textarea: responsive height rows={4} on mobile to avoid pushing results offscreen */}
            <div className="relative">
              <textarea
                id="chinese-input"
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.inputPlaceholder}
                className="w-full rounded-xl border border-slate-300 p-3 sm:p-3.5 text-slate-800 font-chinese text-base sm:text-lg sm:rows-6 lg:rows-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all resize-y placeholder:font-sans placeholder:text-base sm:placeholder:text-sm placeholder:text-slate-400 leading-relaxed min-h-[110px] sm:min-h-[160px]"
              />
            </div>

            {/* Input Toolbar & Counters */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2.5 sm:gap-3 text-slate-600">
                <span>
                  {t.totalChars} <strong className="text-slate-800 font-semibold">{stats.chars}</strong>
                </span>
                <span>•</span>
                <span>
                  {t.chineseChars} <strong className="text-indigo-600 font-semibold">{stats.chineseChars}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePaste}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium transition-all touch-manipulation active:scale-95 min-h-[40px] sm:min-h-0"
                  title={t.paste}
                >
                  <Clipboard className="w-4 h-4 text-slate-500" />
                  <span>{t.paste}</span>
                </button>
                <button
                  onClick={handleClear}
                  disabled={!inputText}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg hover:bg-rose-50 active:bg-rose-100 text-slate-500 hover:text-rose-600 active:text-rose-700 disabled:opacity-30 transition-all touch-manipulation active:scale-95 min-h-[40px] sm:min-h-0"
                  title={t.clear}
                >
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                  <span>{t.clear}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Results Section */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* View Mode Tabs */}
            <div className="px-3.5 sm:px-5 pt-3 pb-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-medium text-slate-600 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('fulltext')}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all touch-manipulation active:scale-95 min-h-[38px] ${
                    activeTab === 'fulltext'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 active:bg-slate-300/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">{t.tabFullTextShort}</span>
                    <span className="hidden sm:inline">{t.tabFullText}</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('ruby')}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all touch-manipulation active:scale-95 min-h-[38px] ${
                    activeTab === 'ruby'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 active:bg-slate-300/60'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">{t.tabRubyShort}</span>
                    <span className="hidden sm:inline">{t.tabRuby}</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('comparative')}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all touch-manipulation active:scale-95 min-h-[38px] ${
                    activeTab === 'comparative'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 active:bg-slate-300/60'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">{t.tabComparativeShort}</span>
                    <span className="hidden sm:inline">{t.tabComparative}</span>
                  </span>
                </button>
              </div>

              {/* Quick Audio Play for Current Output */}
              <div className="flex items-center justify-end gap-2 text-xs w-full sm:w-auto">
                <button
                  onClick={() => handleSpeakChinese(inputText, 'pane-zh')}
                  disabled={!inputText.trim()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 font-semibold border border-indigo-200/60 transition-all touch-manipulation active:scale-95 min-h-[38px] sm:min-h-0 disabled:opacity-40"
                  title="Play Chinese audio"
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.listenZhShort}</span>
                </button>
                <button
                  onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'pane-vi')}
                  disabled={!result.phoneticVietText}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold border border-emerald-200/60 transition-all touch-manipulation active:scale-95 min-h-[38px] sm:min-h-0 disabled:opacity-40"
                  title="Play Vietnamese sound audio"
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.listenViShort}</span>
                </button>
              </div>
            </div>

            {/* Output Body based on Active Tab */}
            <div className="p-3.5 sm:p-5 min-h-[320px] sm:min-h-[380px]">
              {!inputText.trim() ? (
                <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-slate-400 text-center p-4 sm:p-6">
                  <Languages className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mb-2 sm:mb-3 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-600">{t.emptyTitle}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {t.emptyDesc}
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW 1: Ruby Character Cards with Touch & Tap-to-Speak */}
                  {activeTab === 'ruby' && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:flex lg:flex-wrap gap-2 sm:gap-3 items-start">
                      {result.tokens.map((token, index) => {
                        if (!token.isChinese) {
                          if (token.char === '\n') {
                            return <div key={index} className="col-span-full w-full h-2" />;
                          }
                          return (
                            <div
                              key={index}
                              className="self-center justify-self-center px-1 text-slate-400 font-chinese text-xl font-bold select-none"
                            >
                              {token.char}
                            </div>
                          );
                        }

                        const isCardSpeaking =
                          speakingState.active && speakingState.id === `card-${index}`;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSpeakChinese(token.char, `card-${index}`)}
                            className={`group relative flex flex-col items-center justify-between p-2 sm:p-3 rounded-xl border transition-all duration-150 w-full sm:w-auto sm:min-w-[76px] touch-manipulation active:scale-95 cursor-pointer select-none text-center ${
                              isCardSpeaking
                                ? 'bg-indigo-50 border-indigo-400 shadow-md ring-2 ring-indigo-300 scale-[0.98]'
                                : 'bg-slate-50/80 hover:bg-white active:bg-indigo-50/50 border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                            }`}
                            title={`Play ${token.char}`}
                          >
                            {/* Top: Pinyin with tone symbol */}
                            <span className="text-[11px] sm:text-xs font-mono font-semibold text-emerald-700 tracking-tight leading-none mb-1">
                              {token.pinyin}
                            </span>

                            {/* Center: Hanzi character */}
                            <span className="text-2xl sm:text-4xl font-chinese font-semibold text-slate-900 my-0.5 group-hover:text-indigo-600 transition-colors leading-tight">
                              {token.char}
                            </span>

                            {/* Badges: Vietnamese Phonetic Sound */}
                            <div className="w-full mt-1">
                              <div
                                className={`px-1 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-bold text-center tracking-tight truncate ${
                                  isCardSpeaking
                                    ? 'bg-indigo-200 text-indigo-900'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                                title={`${t.phoneticBadge}: ${token.phoneticViet}`}
                              >
                                {token.phoneticViet}
                              </div>
                            </div>

                            {/* Audio indicator: Always visible on touch/mobile */}
                            <span
                              className={`absolute top-1 right-1 p-0.5 rounded-full transition-opacity ${
                                isCardSpeaking
                                  ? 'opacity-100 bg-indigo-600 text-white animate-bounce'
                                  : 'opacity-50 sm:opacity-0 sm:group-hover:opacity-100 text-indigo-600'
                              }`}
                            >
                              <Volume2 className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW 2: Comparative Table */}
                  {activeTab === 'comparative' && (
                    <div className="overflow-x-auto overscroll-x-contain -webkit-overflow-scrolling-touch border border-slate-200 rounded-xl shadow-xs">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100/90 text-slate-600 font-semibold text-xs border-b border-slate-200">
                          <tr>
                            <th className="hidden sm:table-cell py-2 px-2 sm:px-3 w-8 text-center">{t.tableIndex}</th>
                            <th className="py-2.5 px-2.5 sm:px-3">{t.tableHanzi}</th>
                            <th className="py-2.5 px-2.5 sm:px-3">{t.tablePinyin}</th>
                            <th className="py-2.5 px-2.5 sm:px-3">{t.tablePhonetic}</th>
                            <th className="py-2.5 px-2 sm:px-3 text-center w-12">{t.tableListen}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.tokens
                            .filter((t) => t.isChinese)
                            .map((token, idx) => (
                              <tr
                                key={idx}
                                onClick={() => handleSpeakChinese(token.char, `tbl-${idx}`)}
                                className="hover:bg-indigo-50/40 active:bg-indigo-100/50 transition-colors cursor-pointer touch-manipulation"
                              >
                                <td className="hidden sm:table-cell py-2 px-2 sm:px-3 text-xs text-slate-400 font-mono text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-2.5 sm:px-3 font-chinese text-xl font-bold text-slate-900">
                                  {token.char}
                                </td>
                                <td className="py-2.5 px-2.5 sm:px-3 font-mono font-medium text-emerald-700 text-xs sm:text-sm">
                                  {token.pinyin}
                                </td>
                                <td className="py-2.5 px-2.5 sm:px-3 font-semibold text-indigo-700 text-xs sm:text-sm">
                                  {token.phoneticViet}
                                </td>
                                <td className="py-2 px-2 sm:px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleSpeakChinese(token.char, `tbl-${idx}`)}
                                    className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-500 hover:text-indigo-600 active:text-indigo-800 active:bg-indigo-100 transition-all touch-manipulation active:scale-90"
                                    title={`Play ${token.char}`}
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* VIEW 3: Continuous Full Text Output */}
                  {activeTab === 'fulltext' && (
                    <div className="flex flex-col gap-3.5 sm:gap-4">
                      {/* 1. Vietnamese Phonetic Reading */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 relative">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0" />
                            <span className="truncate">{t.fulltextPhoneticTitle}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'ft-vi')}
                              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 transition-all touch-manipulation active:scale-95"
                              title="Play Vietnamese audio"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(result.phoneticVietText, 'copy-phonetic')}
                              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 transition-all touch-manipulation active:scale-95"
                              title="Copy"
                            >
                              {copiedKey === 'copy-phonetic' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-indigo-950 font-sans leading-relaxed sm:leading-loose select-all tracking-wide">
                          {result.phoneticVietText}
                        </p>
                        <p className="mt-2 text-xs text-indigo-600/80 italic">
                          {t.fulltextPhoneticTip}
                        </p>
                      </div>

                      {/* 2. Standard Pinyin Output */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/70 relative">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
                            <span className="truncate">{t.fulltextPinyinTitle}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleSpeakChinese(inputText, 'ft-pinyin')}
                              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-all touch-manipulation active:scale-95"
                              title="Play Chinese audio"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(result.pinyinText, 'copy-pinyin')}
                              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-all touch-manipulation active:scale-95"
                              title="Copy"
                            >
                              {copiedKey === 'copy-pinyin' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-base font-mono font-medium text-slate-800 leading-relaxed sm:leading-loose select-all">
                          {result.pinyinText}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] px-4 text-center text-xs text-slate-400 mt-auto bg-white">
        <p>{t.footerText}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          OpenCC • pinyin-pro • Web Speech API
        </p>
      </footer>
    </div>
  );
}
