import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  toPersianDigits,
  toEnglishDigits,
  formatJalaliDate,
  formatJalaliPretty,
  gregorianToJalali,
  jalaliToGregorian,
  isJalaliLeapYear,
  getTodayJalali,
} from '../src/utils/jalali';
import {
  validateNationalId,
  validateMobileNumber,
  validateName,
  validateAmount,
} from '../src/utils/validation';
import {
  formatCurrencyToman,
  formatSignedCurrencyToman,
  formatThousandsPersian,
  formatNumberInput,
  parseNumberInput,
} from '../src/utils/currency';

describe('1. Digit Normalization & Formatting Tests', () => {
  it('converts English digits to Persian digits correctly', () => {
    assert.strictEqual(toPersianDigits('0123456789'), '۰۱۲۳۴۵۶۷۸۹');
    assert.strictEqual(toPersianDigits(1405), '۱۴۰۵');
    assert.strictEqual(toPersianDigits(''), '');
    assert.strictEqual(toPersianDigits(null), '');
  });

  it('normalizes Persian and Arabic-Indic digits to English digits', () => {
    // Persian digits
    assert.strictEqual(toEnglishDigits('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
    // Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
    assert.strictEqual(toEnglishDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789');
    // Mixed input
    assert.strictEqual(toEnglishDigits('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789');
    assert.strictEqual(toEnglishDigits('0912۳۴۵۶۷۸9'), '09123456789');
  });
});

describe('2. Jalali Date & Calendar Tests', () => {
  it('identifies today as year 1405', () => {
    const today = getTodayJalali();
    assert.strictEqual(today.year, 1405);
    assert.strictEqual(today.month, 7);
    assert.strictEqual(today.day, 5);
    assert.strictEqual(today.formatted, '1405/07/05');
    assert.strictEqual(today.formattedPersian, '۱۴۰۵/۰۷/۰۵');
  });

  it('formats Jalali date correctly with Persian digits and leading zeros', () => {
    assert.strictEqual(formatJalaliDate('1405/7/5'), '۱۴۰۵/۰۷/۰۵');
    assert.strictEqual(formatJalaliDate('1378-05-14'), '۱۳۷۸/۰۵/۱۴');
  });

  it('converts Gregorian to Jalali accurately', () => {
    // 2026-09-27 -> 1405/07/05
    const j = gregorianToJalali(2026, 9, 27);
    assert.strictEqual(j.jy, 1405);
    assert.strictEqual(j.jm, 7);
    assert.strictEqual(j.jd, 5);
  });

  it('converts Jalali back to Gregorian accurately', () => {
    const g = jalaliToGregorian(1405, 7, 5);
    assert.strictEqual(g.gy, 2026);
    assert.strictEqual(g.gm, 9);
    assert.strictEqual(g.gd, 27);
  });

  it('verifies Jalali leap years', () => {
    // 1399 and 1403 are leap years
    assert.strictEqual(isJalaliLeapYear(1399), true);
    assert.strictEqual(isJalaliLeapYear(1403), true);
    assert.strictEqual(isJalaliLeapYear(1404), false);
    assert.strictEqual(isJalaliLeapYear(1405), false);
  });
});

describe('3. Iranian National ID Checksum Tests', () => {
  it('validates genuine national IDs correctly', () => {
    // Valid national IDs
    assert.strictEqual(validateNationalId('0084545933').isValid, true);
    assert.strictEqual(validateNationalId('1234567891').isValid, true);
    // Also with Persian digits
    assert.strictEqual(validateNationalId('۰۰۸۴۵۴۵۹۳۳').isValid, true);
  });

  it('rejects invalid national IDs', () => {
    // Repetitive identical numbers
    assert.strictEqual(validateNationalId('1111111111').isValid, false);
    assert.strictEqual(validateNationalId('0000000000').isValid, false);
    // Wrong length
    assert.strictEqual(validateNationalId('12345').isValid, false);
    // Bad checksum
    assert.strictEqual(validateNationalId('0010352529').isValid, false);
  });
});

describe('4. Mobile Number Validation Tests', () => {
  it('validates 11-digit Iranian mobile starting with 09', () => {
    assert.strictEqual(validateMobileNumber('09123456789').isValid, true);
    assert.strictEqual(validateMobileNumber('۰۹۱۲۳۴۵۶۷۸۹').isValid, true);
    assert.strictEqual(validateMobileNumber('0912-345-6789').isValid, true);
  });

  it('rejects invalid mobile numbers', () => {
    assert.strictEqual(validateMobileNumber('08123456789').isValid, false);
    assert.strictEqual(validateMobileNumber('0912345678').isValid, false);
    assert.strictEqual(validateMobileNumber('091234567890').isValid, false);
  });
});

describe('5. Currency & Money Formatting Tests', () => {
  it('formats Toman currency with Persian digits and non-breaking space', () => {
    const formatted = formatCurrencyToman(1500000);
    assert.strictEqual(formatted, '۱,۵۰۰,۰۰۰\u00A0تومان');
    // Without unit
    assert.strictEqual(formatCurrencyToman(1500000, false), '۱,۵۰۰,۰۰۰');
    // Zero
    assert.strictEqual(formatCurrencyToman(0), '۰\u00A0تومان');
  });

  it('formats signed transaction amounts with LTR isolation mark', () => {
    const payment = formatSignedCurrencyToman(2500000, true);
    assert.ok(payment.includes('+'));
    assert.ok(payment.includes('۲,۵۰۰,۰۰۰'));
    assert.ok(payment.includes('\u00A0تومان'));

    const charge = formatSignedCurrencyToman(1500000, false);
    assert.ok(charge.includes('-'));
    assert.ok(charge.includes('۱,۵۰۰,۰۰۰'));
  });

  it('formats number inputs and parses user input correctly', () => {
    assert.strictEqual(formatNumberInput('1500000'), '1,500,000');
    assert.strictEqual(formatNumberInput('۱۵۰۰۰۰۰'), '1,500,000');
    assert.strictEqual(parseNumberInput('1,500,000'), 1500000);
    assert.strictEqual(parseNumberInput('۱,۵۰۰,۰۰۰'), 1500000);
  });
});
