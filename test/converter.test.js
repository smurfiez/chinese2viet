import { describe, it, expect } from 'vitest';
import {
  pinyinToVietnameseSyllable,
  convertChineseToVietnamese,
  getHanVietReading,
} from '../src/utils/converter.js';

describe('pinyinToVietnameseSyllable', () => {
  it('converts common syllables accurately with tones', () => {
    expect(pinyinToVietnameseSyllable('ni3')).toBe('nỉ');
    expect(pinyinToVietnameseSyllable('hao3')).toBe('hảo');
    expect(pinyinToVietnameseSyllable('zhong1')).toBe('trung');
    expect(pinyinToVietnameseSyllable('guo2')).toBe('cuố');
    expect(pinyinToVietnameseSyllable('wo3')).toBe('ủa');
    expect(pinyinToVietnameseSyllable('shi4')).toBe('sư');
    expect(pinyinToVietnameseSyllable('ai4')).toBe('ai');
    expect(pinyinToVietnameseSyllable('ren2')).toBe('rấn');
    expect(pinyinToVietnameseSyllable('xie4')).toBe('xiê');
    expect(pinyinToVietnameseSyllable('xue2')).toBe('xuê');
  });

  it('handles neutral tones and tone variations', () => {
    expect(pinyinToVietnameseSyllable('ba1')).toBe('ba');
    expect(pinyinToVietnameseSyllable('ba4')).toBe('ba');
    expect(pinyinToVietnameseSyllable('ma0')).toBe('ma');
  });

  it('converts y- and w- glide series and handles tone placement on diphthongs correctly', () => {
    expect(pinyinToVietnameseSyllable('ye2')).toBe('dế');
    expect(pinyinToVietnameseSyllable('ying2')).toBe('ính');
    expect(pinyinToVietnameseSyllable('wen2')).toBe('uấn');
    expect(pinyinToVietnameseSyllable('wei4')).toBe('uây');
    expect(pinyinToVietnameseSyllable('jia3')).toBe('chỉa');
  });
});

describe('getHanVietReading', () => {
  it('retrieves accurate Sino-Vietnamese readings for both simplified and traditional', () => {
    expect(getHanVietReading('中', 'zhong1')).toContain('trung');
    expect(getHanVietReading('国', 'guo2')).toContain('quốc');
    expect(getHanVietReading('國', 'guo2')).toContain('quốc');
    expect(getHanVietReading('学', 'xue2')).toContain('học');
    expect(getHanVietReading('學', 'xue2')).toContain('học');
    expect(getHanVietReading('你', 'ni3')).toContain('nhĩ');
    expect(getHanVietReading('好', 'hao3')).toContain('hảo');
  });
});

describe('convertChineseToVietnamese', () => {
  it('processes full sentence with tokens and full strings', () => {
    const result = convertChineseToVietnamese('你好，中国！');
    expect(result.tokens).toHaveLength(6);
    expect(result.tokens[0].char).toBe('你');
    expect(result.tokens[0].pinyin).toBe('nǐ');
    expect(result.tokens[0].phoneticViet).toBe('nỉ');
    expect(result.tokens[0].hanViet).toBe('nhĩ');

    expect(result.tokens[1].char).toBe('好');
    expect(result.tokens[1].hanViet).toBe('hảo');

    expect(result.hanVietText.toLowerCase()).toContain('nhĩ hảo, trung quốc!');
    expect(result.phoneticVietText.toLowerCase()).toContain('nỉ hảo, trung cuố!');
    expect(result.pinyinText).toContain('nǐ hǎo, zhōng guó!');
  });

  it('handles common conversational phrases and idioms correctly', () => {
    const test1 = convertChineseToVietnamese('我爱你');
    expect(test1.hanVietText.toLowerCase()).toBe('ngã ái nhĩ');
    expect(test1.phoneticVietText.toLowerCase()).toBe('ủa ai nỉ');

    const test2 = convertChineseToVietnamese('谢谢你');
    expect(test2.hanVietText.toLowerCase()).toBe('tạ tạ nhĩ');
    expect(test2.phoneticVietText.toLowerCase()).toBe('xiê xiê nỉ');

    const test3 = convertChineseToVietnamese('對不起');
    expect(test3.hanVietText.toLowerCase()).toBe('đối bất khởi');
    expect(test3.phoneticVietText.toLowerCase()).toBe('tuây bu chỉ');

    const test4 = convertChineseToVietnamese('新年快乐');
    expect(test4.hanVietText.toLowerCase()).toBe('tân niên khoái lạc');

    const testMusic = convertChineseToVietnamese('音乐');
    expect(testMusic.hanVietText.toLowerCase()).toBe('âm nhạc');

    const testBank = convertChineseToVietnamese('银行');
    expect(testBank.hanVietText.toLowerCase()).toBe('ngân hàng');

    const test5 = convertChineseToVietnamese('千里之行，始于足下');
    expect(test5.hanVietText.toLowerCase()).toMatch(/thiên lý chi hành, thuỷ (vu|ư) túc hạ/);
  });

  it('handles multi-line text and mixed characters safely', () => {
    const text = "第一天: Day 1\n北京欢迎你！Beijing 2026 🎉";
    const result = convertChineseToVietnamese(text);
    expect(result.tokens.length).toBeGreaterThan(10);
    expect(result.hanVietText).toContain("Đệ nhất thiên: Day 1");
    expect(result.hanVietText).toContain("Bắc Kinh hoan nghênh nhĩ!");
    expect(result.phoneticVietText).toContain("Ti i thiên");
    expect(result.hanVietText).toContain("🎉");
  });

  it('inserts space after punctuation before non-Chinese text and capitalizes after CRLF', () => {
    const text = "你好！World\r\n明天见？Tomorrow";
    const result = convertChineseToVietnamese(text);
    expect(result.hanVietText).toContain("Nhĩ hảo! World");
    expect(result.hanVietText).toContain("Minh thiên kiến? Tomorrow");
    expect(result.phoneticVietText).toContain("Nỉ hảo! World");
    expect(result.phoneticVietText).toContain("Mính thiên chiên? Tomorrow");
    expect(result.pinyinText).toContain("nǐ hǎo! World");
    expect(result.pinyinText).toContain("míng tiān jiàn? Tomorrow");
  });
});
