import * as OpenCC from 'opencc-js';
import { pinyin } from 'pinyin-pro';
import { hanvietData } from 'hanviet-pinyin-words';
import { getEnglishMeaning } from '../data/chineseEnglishDict.js';

// Simplified to Traditional converter for dictionary lookup
const s2t = OpenCC.Converter({ from: 'cn', to: 'hk' });

// Common / curated Sino-Vietnamese overrides for familiar colloquial usage
const HANVIET_OVERRIDES = {
  '你': ['nhĩ', 'nễ'],
  '喝': ['hát'],
  '吃': ['cật'],
  '这': ['giá'],
  '這': ['giá'],
  '那': ['na'],
  '哪': ['nả'],
  '谁': ['thuỳ'],
  '誰': ['thuỳ'],
  '么': ['ma'],
  '麼': ['ma'],
  '什': ['thậm'],
  '很': ['hẩn'],
  '给': ['cấp'],
  '給': ['cấp'],
  '说': ['thuyết'],
  '說': ['thuyết'],
  '买': ['mãi'],
  '買': ['mãi'],
  '卖': ['mại'],
  '賣': ['mại'],
  '会': ['hội'],
  '會': ['hội'],
  '钱': ['tiền'],
  '錢': ['tiền'],
  '对': ['đối'],
  '對': ['đối'],
  '起': ['khởi'],
  '谢': ['tạ'],
  '謝': ['tạ'],
  '见': ['kiến'],
  '見': ['kiến'],
  '再': ['tái'],
};

// Exact syllable overrides for the most natural Vietnamese transliteration
const SPECIAL_SYLLABLES = {
  // Common pronouns and words
  'wo3': 'ủa',
  'wo1': 'ua',
  'wo2': 'uá',
  'wo4': 'uố',
  'wo0': 'ua',
  'wo5': 'ua',
  'ni3': 'nỉ',
  'ni1': 'ni',
  'ni2': 'ní',
  'ni4': 'ni',
  'hao3': 'hảo',
  'hao4': 'hạo',
  'hao1': 'hao',
  'hao2': 'háo',
  'zhong1': 'trung',
  'zhong4': 'trúng',
  'guo2': 'cuố',
  'guo1': 'cua',
  'guo3': 'của',
  'guo4': 'quá',
  'guo0': 'cua',
  'guo5': 'cua',
  'shi4': 'sư',
  'shi1': 'sư',
  'shi2': 'sứ',
  'shi3': 'sử',
  'shi0': 'sư',
  'shi5': 'sư',
  'ren2': 'rấn',
  'ren4': 'rận',
  'ren3': 'rẫn',
  'ren1': 'rân',
  'xie4': 'xiê',
  'xie1': 'xiê',
  'xie2': 'xié',
  'xie3': 'xiẻ',
  'xie0': 'xiê',
  'xie5': 'xiê',
  'xue2': 'xuê',
  'xue1': 'xuê',
  'xue3': 'xuẻ',
  'xue4': 'xuệ',
  'ai4': 'ai',
  'ai1': 'ai',
  'ai2': 'ái',
  'ai3': 'ải',
  'men0': 'mân',
  'men5': 'mân',
  'men2': 'mấn',
  'de0': 'tơ',
  'de5': 'tơ',
  'de2': 'tớ',
  'ma0': 'ma',
  'ma5': 'ma',
  'ma1': 'ma',
  'ma2': 'má',
  'ma3': 'mả',
  'ma4': 'mạ',
  'ba0': 'ba',
  'ba5': 'ba',
  'ba1': 'ba',
  'ba2': 'bá',
  'ba3': 'bả',
  'ba4': 'ba',
  'bu4': 'bu',
  'bu2': 'bú',
  'bu0': 'bu',
  'bu5': 'bu',
  'dui4': 'tuây',
  'qi3': 'chỉ',
  'zai4': 'chai',
  'jian4': 'chiên',
};

// Vowel tone map for placing Vietnamese accents
const VOWEL_ACCENTS = {
  a: { 1: 'a', 2: 'á', 3: 'ả', 4: 'a', 0: 'a', 5: 'a' },
  ă: { 1: 'ă', 2: 'ắ', 3: 'ẳ', 4: 'ă', 0: 'ă', 5: 'ă' },
  â: { 1: 'â', 2: 'ấ', 3: 'ẩ', 4: 'â', 0: 'â', 5: 'â' },
  e: { 1: 'e', 2: 'é', 3: 'ẻ', 4: 'e', 0: 'e', 5: 'e' },
  ê: { 1: 'ê', 2: 'ế', 3: 'ể', 4: 'ê', 0: 'ê', 5: 'ê' },
  i: { 1: 'i', 2: 'í', 3: 'ỉ', 4: 'i', 0: 'i', 5: 'i' },
  o: { 1: 'o', 2: 'ó', 3: 'ỏ', 4: 'o', 0: 'o', 5: 'o' },
  ô: { 1: 'ô', 2: 'ố', 3: 'ổ', 4: 'ô', 0: 'ô', 5: 'ô' },
  ơ: { 1: 'ơ', 2: 'ớ', 3: 'ở', 4: 'ơ', 0: 'ơ', 5: 'ơ' },
  u: { 1: 'u', 2: 'ú', 3: 'ủ', 4: 'u', 0: 'u', 5: 'u' },
  ư: { 1: 'ư', 2: 'ứ', 3: 'ử', 4: 'ư', 0: 'ư', 5: 'ư' },
  y: { 1: 'y', 2: 'ý', 3: 'ỷ', 4: 'y', 0: 'y', 5: 'y' },
};

// Standalone syllables (y-, w- glides and zero-initial vowels)
const STANDALONE_SYLLABLES = {
  // y- series
  'yi': 'i',
  'ya': 'da',
  'ye': 'dê',
  'yao': 'dao',
  'you': 'dâu',
  'yan': 'diên',
  'yang': 'diang',
  'yin': 'in',
  'ying': 'inh',
  'yong': 'dung',
  'yu': 'du',
  'yue': 'duê',
  'yuan': 'doan',
  'yun': 'duyn',

  // w- series
  'wu': 'u',
  'wa': 'oa',
  'wo': 'ua',
  'wai': 'oai',
  'wei': 'uây',
  'wan': 'oan',
  'wen': 'uân',
  'wang': 'oang',
  'weng': 'uâng',

  // standalone vowels
  'er': 'ơ',
  'a': 'a',
  'o': 'ua',
  'e': 'ơ',
  'ai': 'ai',
  'ei': 'ây',
  'ao': 'ao',
  'ou': 'âu',
  'an': 'an',
  'en': 'ân',
  'ang': 'ang',
  'eng': 'âng',
};

function addVietnameseTone(word, toneNum) {
  if (!toneNum || toneNum === 1 || toneNum === 4 || toneNum === 0 || toneNum === 5) {
    return word;
  }

  // Priority 1: Vowels with hats / horns (â, ê, ô, ơ, ư, ă)
  const priorityVowels = ['â', 'ê', 'ô', 'ơ', 'ư', 'ă'];
  for (const pv of priorityVowels) {
    const idx = word.indexOf(pv);
    if (idx !== -1) {
      const accented = VOWEL_ACCENTS[pv]?.[toneNum] || pv;
      return word.slice(0, idx) + accented + word.slice(idx + 1);
    }
  }

  // Priority 2: In Vietnamese 'ia' and 'iu', tone goes on 'i' (e.g. mỉa, líu)
  if (word.includes('ia')) {
    const idx = word.indexOf('ia');
    const accented = VOWEL_ACCENTS['i']?.[toneNum] || 'i';
    return word.slice(0, idx) + accented + word.slice(idx + 1);
  }
  if (word.includes('iu')) {
    const idx = word.indexOf('iu');
    const accented = VOWEL_ACCENTS['i']?.[toneNum] || 'i';
    return word.slice(0, idx) + accented + word.slice(idx + 1);
  }

  // Priority 3: Regular vowels in order of general prominence: 'a', 'o', 'e', 'u', 'i', 'y'
  const regularVowels = ['a', 'o', 'e', 'u', 'i', 'y'];
  for (const rv of regularVowels) {
    const idx = word.indexOf(rv);
    if (idx !== -1) {
      const accented = VOWEL_ACCENTS[rv]?.[toneNum] || rv;
      return word.slice(0, idx) + accented + word.slice(idx + 1);
    }
  }

  return word;
}

/**
 * Convert a Pinyin syllable (with tone number, e.g. "zhong1", "hao3") to Vietnamese phonetic sound.
 */
export function pinyinToVietnameseSyllable(pinyinNum) {
  if (!pinyinNum) return '';
  const clean = pinyinNum.toLowerCase().trim();

  // If there's an exact syllable override, use it
  if (SPECIAL_SYLLABLES[clean]) {
    return SPECIAL_SYLLABLES[clean];
  }

  // Extract tone number (1-5, or 0)
  const match = clean.match(/^([a-züv]+)([0-5]?)$/);
  if (!match) return clean;

  const rawBase = match[1];
  const tone = match[2] ? parseInt(match[2], 10) : 1;

  // Check standalone syllables (zero-initial vowels and y-, w- glides)
  if (STANDALONE_SYLLABLES[rawBase]) {
    return addVietnameseTone(STANDALONE_SYLLABLES[rawBase], tone);
  }

  // Split initial (thanh mẫu) and final (vận mẫu)
  let initial = '';
  let final = rawBase;

  const initials = [
    'zh', 'ch', 'sh',
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'g', 'k', 'h',
    'j', 'q', 'x',
    'r', 'z', 'c', 's'
  ];

  for (const init of initials) {
    if (rawBase.startsWith(init)) {
      initial = init;
      final = rawBase.slice(init.length);
      break;
    }
  }

  // Map Initial to Vietnamese
  let vietInitial = '';
  switch (initial) {
    case 'b': vietInitial = 'p'; break;
    case 'p': vietInitial = 'ph'; break;
    case 'm': vietInitial = 'm'; break;
    case 'f': vietInitial = 'ph'; break;
    case 'd': vietInitial = 't'; break;
    case 't': vietInitial = 'th'; break;
    case 'n': vietInitial = 'n'; break;
    case 'l': vietInitial = 'l'; break;
    case 'g': vietInitial = (['i', 'e'].includes(final[0]) ? 'k' : 'c'); break;
    case 'k': vietInitial = 'kh'; break;
    case 'h': vietInitial = 'h'; break;
    case 'j': vietInitial = 'ch'; break;
    case 'q': vietInitial = 'ch'; break;
    case 'x': vietInitial = 'x'; break;
    case 'zh': vietInitial = 'tr'; break;
    case 'ch': vietInitial = 'tr'; break;
    case 'sh': vietInitial = 's'; break;
    case 'r': vietInitial = 'r'; break;
    case 'z': vietInitial = 'ch'; break;
    case 'c': vietInitial = 'x'; break;
    case 's': vietInitial = 'x'; break;
    default:
      vietInitial = '';
  }

  // Map Final to Vietnamese
  let vietFinal = final;

  // Special i after retroflex / dental sibilants zh, ch, sh, r, z, c, s -> 'ư'
  if (['zh', 'ch', 'sh', 'r', 'z', 'c', 's'].includes(initial) && final === 'i') {
    vietFinal = 'ư';
  } else {
    const finalsMap = {
      'a': 'a',
      'o': 'ua',
      'e': 'ơ',
      'i': 'i',
      'u': 'u',
      'v': 'uy',
      'ü': 'uy',
      'ai': 'ai',
      'ei': 'ây',
      'ao': 'ao',
      'ou': 'âu',
      'an': 'an',
      'en': 'ân',
      'ang': 'ang',
      'eng': 'âng',
      'ong': 'ung',
      'ia': 'ia',
      'ie': 'iê',
      'iao': 'ieo',
      'iu': 'yêu',
      'ian': 'iên',
      'in': 'in',
      'iang': 'iang',
      'ing': 'inh',
      'iong': 'iung',
      'ua': 'oa',
      'uo': 'ua',
      'uai': 'oai',
      'ui': 'uây',
      'uan': 'oan',
      'un': 'uân',
      'uang': 'oang',
      'ue': 'uê',
      'üe': 'uyê',
      'er': 'ơ',
    };

    if (finalsMap[final]) {
      vietFinal = finalsMap[final];
    }
  }

  let combined = '';
  if (!vietInitial) {
    combined = vietFinal;
  } else {
    // Avoid double letters like qu + oa -> qua
    if (vietInitial === 'qu' && vietFinal.startsWith('oa')) {
      combined = 'qu' + vietFinal.slice(1);
    } else {
      combined = vietInitial + vietFinal;
    }
  }

  // Apply tone
  return addVietnameseTone(combined, tone);
}

/**
 * Get Sino-Vietnamese (Hán-Việt) reading for a Chinese character.
 */
export function getHanVietReading(char, pinyinNum = '') {
  if (!char) return [];

  // Check manual overrides first
  if (HANVIET_OVERRIDES[char]) {
    return HANVIET_OVERRIDES[char];
  }

  const tradChar = s2t(char);
  if (HANVIET_OVERRIDES[tradChar]) {
    return HANVIET_OVERRIDES[tradChar];
  }

  const entry = hanvietData[tradChar] || hanvietData[char];
  if (!entry) return [];

  if (pinyinNum && entry[pinyinNum]) {
    return entry[pinyinNum];
  }

  if (entry['*']) {
    return entry['*'];
  }

  const allReadings = Object.values(entry).flat();
  return Array.from(new Set(allReadings));
}

/**
 * Full conversion function from Chinese text to Vietnamese representation tokens and strings.
 */
export function convertChineseToVietnamese(inputText) {
  if (!inputText) {
    return {
      tokens: [],
      pinyinText: '',
      phoneticVietText: '',
      hanVietText: '',
    };
  }

  // Use pinyin-pro's contextual word segmentation on the entire string
  const pinyinItems = pinyin(inputText, { type: 'all', toneType: 'num' });
  const pinyinSymbols = pinyin(inputText, { type: 'all', toneType: 'symbol' });

  const tokens = [];

  for (let i = 0; i < pinyinItems.length; i++) {
    const item = pinyinItems[i];
    const symItem = pinyinSymbols[i];
    const ch = item.origin;

    if (!item.isZh) {
      // Non-Chinese character: punctuation, space, number, latin letter
      tokens.push({
        char: ch,
        isChinese: false,
        pinyin: ch,
        pinyinNum: '',
        phoneticViet: ch,
        hanViet: ch,
        hanVietOptions: [ch],
        english: '',
      });
      continue;
    }

    const pySymbol = symItem ? symItem.result : item.result;
    const pyNum = item.result;

    // Get Vietnamese phonetic approximation
    const phoneticViet = pinyinToVietnameseSyllable(pyNum);

    // Get Hán-Việt reading using contextual pinyin
    const hvOptions = getHanVietReading(ch, pyNum);
    const hanViet = hvOptions.length > 0 ? hvOptions[0] : ch;
    const english = getEnglishMeaning(ch);

    tokens.push({
      char: ch,
      isChinese: true,
      pinyin: pySymbol,
      pinyinNum: pyNum,
      phoneticViet: phoneticViet,
      hanViet: hanViet,
      hanVietOptions: hvOptions,
      english: english,
    });
  }

  // Build continuous text strings
  // When building sentences, add spacing between adjacent Chinese characters
  let pinyinParts = [];
  let phoneticParts = [];
  let hanVietParts = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];

    if (!t.isChinese) {
      if (prev && prev.isChinese && /[a-zA-Z0-9]/.test(t.char)) {
        pinyinParts.push(' ');
        phoneticParts.push(' ');
        hanVietParts.push(' ');
      }
      pinyinParts.push(t.char);
      phoneticParts.push(t.char);
      hanVietParts.push(t.char);
    } else {
      if (prev && prev.isChinese) {
        pinyinParts.push(' ');
        phoneticParts.push(' ');
        hanVietParts.push(' ');
      } else if (prev && !prev.isChinese && !/\s|[，。！？；：“”‘’（）《》、\.,!\?;:]/.test(prev.char)) {
        pinyinParts.push(' ');
        phoneticParts.push(' ');
        hanVietParts.push(' ');
      }

      pinyinParts.push(t.pinyin);
      phoneticParts.push(t.phoneticViet);
      hanVietParts.push(t.hanViet);
    }
  }

  // Capitalize sentence start and after newlines
  const capitalize = (str) => {
    if (!str) return '';
    return str.replace(/(^\s*|[.!?]\s+|[\r\n]+\s*)(\p{L})/gu, (m, p1, p2) => p1 + p2.toUpperCase());
  };

  // Convert Chinese full-width punctuation to standard punctuation with appropriate spacing
  const normalizePunctuation = (str) => {
    return str
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
      .replace(/！/g, '! ')
      .replace(/？/g, '? ')
      .replace(/；/g, '; ')
      .replace(/：/g, ': ')
      .replace(/、/g, ', ')
      .replace(/（/g, ' (')
      .replace(/）/g, ') ')
      .replace(/【/g, ' [')
      .replace(/】/g, '] ')
      .replace(/《/g, ' «')
      .replace(/》/g, '» ')
      .replace(/([.!?,;:])(?=[^\s.!?,;:])/gu, '$1 ')
      .replace(/[ ]+/g, ' ')
      .replace(/ ,/g, ',')
      .replace(/ \./g, '.')
      .replace(/ !/g, '!')
      .replace(/ \?/g, '?')
      .replace(/ ;/g, ';')
      .replace(/ :/g, ':')
      .replace(/[ ]+([\r\n])/g, '$1')
      .trim();
  };

  const PROPER_NAME_REPLACEMENTS = [
    [/\bbắc kinh\b/gi, 'Bắc Kinh'],
  ];

  const pinyinText = normalizePunctuation(pinyinParts.join(''));
  const phoneticVietText = capitalize(normalizePunctuation(phoneticParts.join('')));
  let hanVietText = capitalize(normalizePunctuation(hanVietParts.join('')));

  for (const [pattern, replacement] of PROPER_NAME_REPLACEMENTS) {
    hanVietText = hanVietText.replace(pattern, replacement);
  }

  return {
    tokens,
    pinyinText,
    phoneticVietText,
    hanVietText,
  };
}
