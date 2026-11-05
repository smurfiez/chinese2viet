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
} from 'lucide-react';
import { convertChineseToVietnamese } from './utils/converter.js';
import {
  speakChinese,
  speakVietnamese,
  stopSpeech,
  isSpeechSupported,
} from './utils/speech.js';

// OpenCC converters
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'hk' });
const t2sConverter = OpenCC.Converter({ from: 'hk', to: 'cn' });

const PRESETS = [
  { label: '你好 (Chào hỏi)', text: '你好，很高兴认识你！' },
  { label: '我爱你 (Tình cảm)', text: '我爱你，一生一世在一起。' },
  { label: '新年快乐 (Chúc mừng)', text: '祝你新年快乐，万事如意，身体健康！' },
  { label: '千里之行 (Thành ngữ)', text: '千里之行，始于足下。' },
  { label: '喝咖啡 (Đời sống)', text: '今天天气真好，去喝咖啡吧！' },
];

export default function App() {
  const [inputText, setInputText] = useState('你好，很高兴认识你！今天天气真好。');
  const [activeTab, setActiveTab] = useState('ruby'); // 'ruby' | 'comparative' | 'fulltext'
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
        triggerToast('Đã sao chép vào bộ nhớ tạm!');
        setTimeout(() => setCopiedKey(null), 1800);
      });
    },
    [triggerToast]
  );

  // Paste helper
  const handlePaste = useCallback(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((clipText) => {
        if (clipText) {
          setInputText(clipText);
          triggerToast('Đã dán văn bản!');
        }
      });
    }
  }, [triggerToast]);

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
      triggerToast('Đã chuyển sang chữ Giản thể (Simplified)');
    } else {
      const traditional = s2tConverter(inputText);
      setInputText(traditional);
      setIsTraditional(true);
      triggerToast('Đã chuyển sang chữ Phồn thể (Traditional)');
    }
  }, [isTraditional, inputText, triggerToast]);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm backdrop-blur-sm transition-all animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Chinese2Viet
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                    Hán-Việt & Phát Âm
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Âm Hán-Việt & Phiên âm phát âm tiếng Trung theo vần điệu tiếng Việt
                </p>
              </div>
            </div>

            {/* Quick Actions / Audio Controls */}
            <div className="flex items-center flex-wrap gap-2">
              {speakingState.active ? (
                <button
                  onClick={handleStopSpeech}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-medium border border-rose-200 transition-colors shadow-sm"
                  title="Dừng phát âm"
                >
                  <VolumeX className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Dừng đọc</span>
                </button>
              ) : null}

              <button
                onClick={() => handleSpeakChinese(inputText, 'header-zh')}
                disabled={!inputText.trim() || !isSpeechSupported()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white text-xs sm:text-sm font-medium transition-all shadow-sm shadow-indigo-200"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe tiếng Trung (Bắc Kinh)</span>
              </button>

              <button
                onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'header-vi')}
                disabled={!result.phoneticVietText || !isSpeechSupported()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white text-xs sm:text-sm font-medium transition-all shadow-sm shadow-emerald-200"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe âm tiếng Việt</span>
              </button>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
                  showGuide
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Bảng tra thanh điệu"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Hướng dẫn thanh điệu</span>
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Mẫu nhanh:
            </span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(p.text);
                  setIsTraditional(false);
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 hover:border-indigo-200 transition-colors"
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
          <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm transition-all animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-amber-950">
                  Bảng Hướng Dẫn Thanh Điệu & Đối Chiếu Âm Tiếng Việt
                </h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-amber-700 hover:text-amber-900 text-xs px-2 py-1 rounded hover:bg-amber-100"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Thanh 1 (阴平 - Cao phẳng)</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
                    ā
                  </span>
                </div>
                <p className="text-slate-600">
                  Cao độ 55, ngân đều phẳng, không đổi cao độ.
                </p>
                <div className="mt-2 text-indigo-700 font-medium">
                  → Âm Việt: <span className="font-bold">Thanh Ngang</span> (mā → ma, sān → san)
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Thanh 2 (阳平 - Vút lên)</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold">
                    á
                  </span>
                </div>
                <p className="text-slate-600">
                  Cao độ 35, bắt đầu trung bình rồi vuốt lên cao.
                </p>
                <div className="mt-2 text-emerald-700 font-medium">
                  → Âm Việt: <span className="font-bold">Dấu Sắc</span> (má → má, rén → rấn)
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Thanh 3 (上声 - Xuống lên)</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-bold">
                    ǎ
                  </span>
                </div>
                <p className="text-slate-600">
                  Cao độ 214, trầm xuống đáy rồi hất nhẹ lên.
                </p>
                <div className="mt-2 text-amber-800 font-medium">
                  → Âm Việt: <span className="font-bold">Dấu Hỏi / Ngã</span> (mǎ → mả, hǎo → hảo)
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Thanh 4 (去声 - Rơi mạnh)</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold">
                    à
                  </span>
                </div>
                <p className="text-slate-600">
                  Cao độ 51, rơi từ đỉnh xuống đáy, dứt khoát nhanh.
                </p>
                <div className="mt-2 text-rose-700 font-medium">
                  → Âm Việt: <span className="font-bold">Dứt khoát đanh</span> (mà → mạ/ma, bà → ba)
                </div>
              </div>
            </div>

            <div className="text-xs text-amber-900 bg-amber-100/60 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <span className="font-bold">Phân biệt 2 cách đọc:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-700">
                  <li>
                    <strong className="text-indigo-800">Âm Hán-Việt (Sino-Vietnamese):</strong> Cách đọc truyền thống của từ Hán theo ngữ âm tiếng Việt cổ, giúp người Việt hiểu rõ nghĩa gốc từ vựng và tra từ điển.
                  </li>
                  <li>
                    <strong className="text-emerald-800">Phiên âm phát âm tiếng Việt (Phonetic):</strong> Mô phỏng âm thanh tiếng Quan thoại hiện đại (Mandarin) bằng chữ quốc ngữ, giúp người mới học đọc chuẩn ngữ điệu Bắc Kinh ngay lập tức.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Dual-Pane Layout: Left Input, Right Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT PANE: Input Section */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="chinese-input" className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <span>Nhập chữ Hán (Văn bản tiếng Trung)</span>
                {speakingState.active && speakingState.type === 'zh' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </label>

              {/* Script Toggle */}
              <button
                onClick={handleToggleScript}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
                title="Chuyển đổi Giản thể / Phồn thể"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isTraditional ? 'Phồn thể (繁)' : 'Giản thể (简)'}</span>
              </button>
            </div>

            {/* Main Textarea */}
            <div className="relative">
              <textarea
                id="chinese-input"
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập hoặc dán chữ tiếng Trung vào đây (ví dụ: 你好，很高兴认识你)..."
                className="w-full rounded-xl border border-slate-300 p-3.5 text-slate-800 font-chinese text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all resize-y placeholder:font-sans placeholder:text-sm placeholder:text-slate-400"
              />
            </div>

            {/* Input Toolbar & Counters */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span>
                  Tổng ký tự: <strong className="text-slate-700 font-semibold">{stats.chars}</strong>
                </span>
                <span>
                  Chữ Hán: <strong className="text-indigo-600 font-semibold">{stats.chineseChars}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Dán từ Clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Dán</span>
                </button>
                <button
                  onClick={handleClear}
                  disabled={!inputText}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  title="Xoá nội dung"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Results Section */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* View Mode Tabs */}
            <div className="px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-medium text-slate-600">
                <button
                  onClick={() => setActiveTab('ruby')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'ruby'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Thẻ từng chữ (Ruby Cards)</span>
                </button>

                <button
                  onClick={() => setActiveTab('comparative')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'comparative'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Song song (Comparative)</span>
                </button>

                <button
                  onClick={() => setActiveTab('fulltext')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'fulltext'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Văn bản liền mạch (Full Text)</span>
                </button>
              </div>

              {/* Quick Audio Play for Current Output */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => handleSpeakChinese(inputText, 'pane-zh')}
                  disabled={!inputText.trim()}
                  className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                  title="Nghe phát âm tiếng Trung"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Trung</span>
                </button>
                <button
                  onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'pane-vi')}
                  disabled={!result.phoneticVietText}
                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1 transition-colors"
                  title="Nghe đọc theo âm tiếng Việt"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Việt</span>
                </button>
              </div>
            </div>

            {/* Output Body based on Active Tab */}
            <div className="p-4 sm:p-5 min-h-[380px]">
              {!inputText.trim() ? (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <Languages className="w-12 h-12 text-slate-300 mb-3 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-600">Chưa có nội dung chuyển đổi</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Hãy nhập chữ tiếng Trung ở khung bên trái hoặc nhấn vào một trong các câu mẫu nhanh phía trên.
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW 1: Ruby Character Cards */}
                  {activeTab === 'ruby' && (
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 items-start content-start">
                      {result.tokens.map((token, index) => {
                        if (!token.isChinese) {
                          // Handle whitespace, newlines, and punctuation gracefully
                          if (token.char === '\n') {
                            return <div key={index} className="w-full h-2" />;
                          }
                          return (
                            <div
                              key={index}
                              className="self-center px-1 text-slate-400 font-chinese text-xl font-bold"
                            >
                              {token.char}
                            </div>
                          );
                        }

                        const isCardSpeaking =
                          speakingState.active && speakingState.id === `card-${index}`;

                        return (
                          <div
                            key={index}
                            className={`group relative flex flex-col items-center p-2.5 sm:p-3 rounded-xl border transition-all duration-150 ${
                              isCardSpeaking
                                ? 'bg-indigo-50 border-indigo-400 shadow-md ring-2 ring-indigo-200'
                                : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                          >
                            {/* Top: Pinyin with tone symbol */}
                            <span className="text-xs font-mono font-semibold text-emerald-700 tracking-wide">
                              {token.pinyin}
                            </span>

                            {/* Center: Hanzi character */}
                            <span className="text-3xl sm:text-4xl font-chinese font-semibold text-slate-900 my-1 group-hover:text-indigo-600 transition-colors">
                              {token.char}
                            </span>

                            {/* Badges: Phonetic & Han-Viet */}
                            <div className="flex flex-col gap-1 w-full mt-1">
                              {/* Vietnamese Phonetic Sound */}
                              <div
                                className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold text-center tracking-tight"
                                title="Phiên âm tiếng Việt tương đương"
                              >
                                {token.phoneticViet}
                              </div>

                              {/* Sino-Vietnamese (Hán-Việt) reading */}
                              <div
                                className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-medium text-center truncate max-w-[70px]"
                                title={`Âm Hán-Việt: ${token.hanVietOptions.join(' / ')}`}
                              >
                                {token.hanViet}
                              </div>
                            </div>

                            {/* Mini speaker on hover / active */}
                            <button
                              onClick={() => handleSpeakChinese(token.char, `card-${index}`)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 shadow-xs border border-indigo-200 transition-opacity"
                              title={`Nghe chữ ${token.char}`}
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW 2: Comparative Table */}
                  {activeTab === 'comparative' && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/80 text-slate-600 font-semibold text-xs border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Chữ Hán</th>
                            <th className="py-2.5 px-3">Pinyin</th>
                            <th className="py-2.5 px-3">Phiên Âm Tiếng Việt</th>
                            <th className="py-2.5 px-3">Âm Hán-Việt</th>
                            <th className="py-2.5 px-3 text-center">Nghe</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.tokens
                            .filter((t) => t.isChinese)
                            .map((token, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                                <td className="py-2.5 px-3 text-xs text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-chinese text-xl font-bold text-slate-900">
                                  {token.char}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-emerald-700">
                                  {token.pinyin}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-indigo-700">
                                  {token.phoneticViet}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-amber-900">
                                  {token.hanViet}
                                  {token.hanVietOptions.length > 1 && (
                                    <span className="text-[10px] text-slate-400 ml-1">
                                      ({token.hanVietOptions.slice(1).join(', ')})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => handleSpeakChinese(token.char, `tbl-${idx}`)}
                                    className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title={`Nghe phát âm chữ ${token.char}`}
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
                    <div className="flex flex-col gap-4">
                      {/* 1. Vietnamese Phonetic Reading */}
                      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                            Phiên âm phát âm theo vần tiếng Việt
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSpeakVietnamese(result.phoneticVietText, 'ft-vi')}
                              className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(result.phoneticVietText, 'copy-phonetic')}
                              className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Sao chép"
                            >
                              {copiedKey === 'copy-phonetic' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed select-all">
                          {result.phoneticVietText}
                        </p>
                        <p className="text-xs text-indigo-600/80 mt-2 italic">
                          💡 Đọc to đoạn này bằng tiếng Việt sẽ tạo ra ngữ điệu rất sát với tiếng Bắc Kinh chuẩn.
                        </p>
                      </div>

                      {/* 2. Sino-Vietnamese (Hán-Việt) Reading */}
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                            Âm Hán - Việt truyền thống
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSpeakVietnamese(result.hanVietText, 'ft-hv')}
                              className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors"
                              title="Nghe âm Hán-Việt"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(result.hanVietText, 'copy-hanviet')}
                              className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors"
                              title="Sao chép"
                            >
                              {copiedKey === 'copy-hanviet' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed select-all">
                          {result.hanVietText}
                        </p>
                        <p className="text-xs text-amber-800/80 mt-2 italic">
                          💡 Âm Hán-Việt giúp đối chiếu hiểu nghĩa từ vựng tiếng Việt gốc Hán.
                        </p>
                      </div>

                      {/* 3. Pinyin with Tones */}
                      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                            Pinyin (Bính âm có dấu)
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSpeakChinese(inputText, 'ft-py')}
                              className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors"
                              title="Nghe tiếng Trung chuẩn"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(result.pinyinText, 'copy-pinyin')}
                              className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors"
                              title="Sao chép"
                            >
                              {copiedKey === 'copy-pinyin' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-base sm:text-lg font-mono font-medium text-emerald-950 leading-relaxed select-all">
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
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Chinese2Viet © 2026 — Công cụ học tiếng Trung qua âm Hán-Việt & vần điệu tiếng Việt.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>OpenCC</span>
            <span>•</span>
            <span>pinyin-pro</span>
            <span>•</span>
            <span>hanviet-pinyin-words</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
