/**
 * Web Speech API utility for Chinese & Vietnamese text-to-speech.
 * Safe for SSR and non-browser environments.
 */

export function isSpeechSupported() {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(
    window.speechSynthesis &&
    (window.SpeechSynthesisUtterance || typeof SpeechSynthesisUtterance !== 'undefined')
  );
}

export function getAvailableVoices() {
  if (!isSpeechSupported()) {
    return [];
  }
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
}

export function stopSpeech() {
  if (!isSpeechSupported()) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel errors
  }
}

function findVoice(voices, langPrefix, preferredLang) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }

  const prefix = langPrefix.toLowerCase();
  const preferred = preferredLang.toLowerCase().replace('_', '-');

  const exact = voices.find(
    (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === preferred
  );
  if (exact) {
    return exact;
  }

  return (
    voices.find(
      (v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
    ) || null
  );
}

function speak(text, { lang, prefix, rate = 1.0, pitch = 1.0, onStart, onEnd, onError } = {}) {
  if (!isSpeechSupported() || !text) {
    return null;
  }

  try {
    stopSpeech();

    const UtteranceClass = window.SpeechSynthesisUtterance || SpeechSynthesisUtterance;
    const utterance = new UtteranceClass(text);

    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = getAvailableVoices();
    const matchedVoice = findVoice(voices, prefix, lang);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = lang;
    }

    if (typeof onStart === 'function') utterance.onstart = onStart;
    if (typeof onEnd === 'function') utterance.onend = onEnd;
    if (typeof onError === 'function') utterance.onerror = onError;

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    }
    return null;
  }
}

export function speakChinese(text, options = {}) {
  return speak(text, {
    lang: 'zh-CN',
    prefix: 'zh',
    ...options,
  });
}

export function speakVietnamese(text, options = {}) {
  return speak(text, {
    lang: 'vi-VN',
    prefix: 'vi',
    ...options,
  });
}

export default {
  isSpeechSupported,
  getAvailableVoices,
  stopSpeech,
  speakChinese,
  speakVietnamese,
};
