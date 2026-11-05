import { describe, it, expect } from 'vitest';
import { isSpeechSupported, speakChinese, speakVietnamese, stopSpeech, getAvailableVoices } from '../src/utils/speech.js';

describe('speech utilities', () => {
  it('safe in non-browser environment', () => {
    expect(isSpeechSupported()).toBe(false);
    expect(getAvailableVoices()).toEqual([]);
    expect(() => stopSpeech()).not.toThrow();
    expect(speakChinese('你好')).toBeNull();
    expect(speakVietnamese('xin chào')).toBeNull();
  });
});
