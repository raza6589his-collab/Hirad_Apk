/**
 * Iranian Jalali (Shamsi) Solar Calendar Utilities
 * Accurate algorithm for conversions, leap years, formatting, and duration calculations.
 */

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const JALALI_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  let str = String(input);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), ENGLISH_DIGITS[i]);
    // Arabic numerals fallback
    str = str.replace(new RegExp(String.fromCharCode(1632 + i), 'g'), ENGLISH_DIGITS[i]);
  }
  return str;
}

/**
 * Checks whether a Jalali year is a leap year
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) {
    throw new Error('Invalid Jalali year');
  }
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) >> 5) * 33;
  let leap = ((n + 1) % 33) - 1;
  if (leap === -1) leap = 4;
  return leap % 4 === 0;
}

/**
 * Returns number of days in a given Jalali month
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) {
    try {
      return isJalaliLeapYear(year) ? 30 : 29;
    } catch {
      return ((year - 1300) % 4 === 3) ? 30 : 29;
    }
  }
  return 30;
}

/**
 * Converts Gregorian date to Jalali date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Converts Jalali date to Gregorian date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy2 = jy - 979;
  let days =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }

  const g_d_m = [0, 31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && days >= g_d_m[gm + 1]) {
    days -= g_d_m[gm + 1];
    gm++;
  }
  let gd = days + 1;
  return { gy, gm: gm + 1, gd };
}

/**
 * Returns today's Jalali date representation
 */
export function getTodayJalali(): { year: number; month: number; day: number; formatted: string; formattedPersian: string } {
  const now = new Date();
  const { jy, jm, jd } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const formatted = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  const formattedPersian = `${toPersianDigits(jy)}/${toPersianDigits(String(jm).padStart(2, '0'))}/${toPersianDigits(String(jd).padStart(2, '0'))}`;
  return { year: jy, month: jm, day: jd, formatted, formattedPersian };
}

/**
 * Formats a Jalali date string (YYYY/MM/DD) into a standard Persian digit date:
 * e.g. "1405/07/05" -> "۱۴۰۵/۰۷/۰۵"
 */
export function formatJalaliDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const clean = toEnglishDigits(String(dateStr).trim());
  const parts = clean.split(/[\/\-]/);
  if (parts.length < 3) return toPersianDigits(dateStr);
  const y = parts[0];
  const m = parts[1].padStart(2, '0');
  const d = parts[2].padStart(2, '0');
  return `${toPersianDigits(y)}/${toPersianDigits(m)}/${toPersianDigits(d)}`;
}

/**
 * Formats a Jalali date string (YYYY/MM/DD) into a friendly Persian text
 * e.g. "۱۴ خرداد ۱۳۷۸"
 */
export function formatJalaliPretty(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = toEnglishDigits(dateStr);
  const parts = cleanStr.split(/[\/\-]/);
  if (parts.length < 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const monthName = JALALI_MONTH_NAMES[m - 1] || '';
  return `${toPersianDigits(d)} ${monthName} ${toPersianDigits(y)}`;
}

/**
 * Calculate age in Persian from a Jalali birth date string
 */
export function calculateAge(birthDateStr: string): { years: number; text: string } {
  if (!birthDateStr) return { years: 0, text: '' };
  try {
    const clean = toEnglishDigits(birthDateStr);
    const [by, bm, bd] = clean.split(/[\/\-]/).map((n) => parseInt(n, 10));
    const today = getTodayJalali();
    let age = today.year - by;
    if (today.month < bm || (today.month === bm && today.day < bd)) {
      age--;
    }
    return {
      years: age,
      text: `${toPersianDigits(age)} سال`
    };
  } catch {
    return { years: 0, text: '' };
  }
}

/**
 * Calculate membership duration from Jalali registration date
 */
export function calculateMembershipDuration(regDateStr: string): string {
  if (!regDateStr) return '';
  try {
    const clean = toEnglishDigits(regDateStr);
    const [ry, rm, rd] = clean.split(/[\/\-]/).map((n) => parseInt(n, 10));
    const today = getTodayJalali();
    
    let months = (today.year - ry) * 12 + (today.month - rm);
    if (today.day < rd) {
      months--;
    }
    if (months <= 0) {
      return 'عضویت جدید (کمتر از ۱ ماه)';
    }
    if (months < 12) {
      return `${toPersianDigits(months)} ماه عضویت`;
    }
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (remMonths === 0) {
      return `${toPersianDigits(years)} سال عضویت`;
    }
    return `${toPersianDigits(years)} سال و ${toPersianDigits(remMonths)} ماه عضویت`;
  } catch {
    return '';
  }
}
