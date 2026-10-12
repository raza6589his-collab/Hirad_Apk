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
  it('identifies today as year 1405 and formats correctly', () => {
    const today = getTodayJalali();
    assert.strictEqual(today.year, 1405);
    assert.ok(today.month >= 1 && today.month <= 12);
    assert.ok(today.day >= 1 && today.day <= 31);
    assert.strictEqual(
      today.formatted,
      `${today.year}/${String(today.month).padStart(2, '0')}/${String(today.day).padStart(2, '0')}`
    );
    assert.ok(today.formattedPersian.length >= 10);
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

describe('6. Backup, Restore & Background Customization Tests', () => {
  it('generates a complete backup data object with all athlete details', async () => {
    const { generateBackupData } = await import('../src/utils/storage');
    const mockAthletes = [
      {
        id: 'ath-1',
        firstName: 'رضا',
        lastName: 'حسینی',
        nationalId: '0084545933',
        mobileNumber: '09121234567',
        registrationDate: '1405/07/01',
        birthDate: '1375/02/10',
        trainingCategory: 'بدنسازی عمومی',
        tuitionPaid: 1500000,
        tuitionUnpaid: 0,
        payments: [
          {
            id: 'pay-1',
            date: '1405/07/01',
            amount: 1500000,
            type: 'payment' as const,
            title: 'شهریه مهر',
          },
        ],
        attendances: [
          {
            id: 'att-1',
            sessionNumber: 1,
            date: '1405/07/02',
            time: '18:30',
          },
        ],
      },
    ];

    const backup = generateBackupData(mockAthletes as any);
    assert.strictEqual(backup.version, '1.4.0');
    assert.strictEqual(backup.totalAthletes, 1);
    assert.strictEqual(backup.totalPayments, 1);
    assert.strictEqual(backup.totalAttendances, 1);
    assert.strictEqual(backup.athletes[0].firstName, 'رضا');
    assert.strictEqual(backup.athletes[0].payments?.length, 1);
    assert.strictEqual(backup.athletes[0].attendances?.length, 1);
  });

  it('validates genuine and malformed backup objects', async () => {
    const { validateBackupData } = await import('../src/utils/storage');

    // Malformed
    const invalidNull = validateBackupData(null);
    assert.strictEqual(invalidNull.valid, false);

    const invalidNoAthletes = validateBackupData({ version: '1.4.0' });
    assert.strictEqual(invalidNoAthletes.valid, false);

    // Valid
    const valid = validateBackupData({
      version: '1.4.0',
      exportDateJalali: '1405/07/21',
      athletes: [
        { id: '1', firstName: 'علی', lastName: 'کرمی' },
      ],
    });
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.summary?.totalAthletes, 1);
  });

  it('provides ready-to-use gym preset backgrounds', async () => {
    const { PRESET_BACKGROUNDS } = await import('../src/utils/storage');
    assert.ok(PRESET_BACKGROUNDS.length >= 5);
    assert.ok(PRESET_BACKGROUNDS.some((p) => p.id === 'carbon_sport'));
    assert.ok(PRESET_BACKGROUNDS.some((p) => p.id === 'amber_gold'));
  });
});

