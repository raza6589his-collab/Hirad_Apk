import { toEnglishDigits, toPersianDigits } from './jalali';

/**
 * Validates Iranian National ID (کد ملی) according to the official checksum algorithm.
 */
export function validateNationalId(code: string): { isValid: boolean; error?: string } {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'کد ملی الزامی است' };
  }

  const cleanCode = toEnglishDigits(code.trim());

  // Check 10 digits
  if (!/^\d{10}$/.test(cleanCode)) {
    return { isValid: false, error: 'کد ملی باید ۱۰ رقم باشد' };
  }

  // Check for repeated identical digits (e.g., 0000000000, 1111111111)
  const allIdentical = /^(\d)\1{9}$/.test(cleanCode);
  if (allIdentical) {
    return { isValid: false, error: 'کد ملی نامعتبر است (ارقام یکسان)' };
  }

  // Official checksum calculation
  const checkDigit = parseInt(cleanCode[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCode[i], 10) * (10 - i);
  }

  const remainder = sum % 11;
  const isChecksumValid =
    (remainder < 2 && checkDigit === remainder) ||
    (remainder >= 2 && checkDigit === 11 - remainder);

  if (!isChecksumValid) {
    return { isValid: false, error: 'کد ملی نامعتبر است (بررسی رقم کنترل شکست خورد)' };
  }

  return { isValid: true };
}

/**
 * Validates Iranian Mobile Number (شماره موبایل ایران)
 * Must begin with 09 and contain exactly 11 digits.
 */
export function validateMobileNumber(mobile: string): { isValid: boolean; error?: string } {
  if (!mobile || !mobile.trim()) {
    return { isValid: false, error: 'شماره موبایل الزامی است' };
  }

  const cleanMobile = toEnglishDigits(mobile.trim().replace(/[\s\-]/g, ''));

  if (!/^09\d{9}$/.test(cleanMobile)) {
    return { isValid: false, error: 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود' };
  }

  return { isValid: true };
}

/**
 * Validates name fields (First name / Last name)
 */
export function validateName(name: string, fieldName: string): { isValid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} الزامی است` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} باید حداقل ۲ حرف باشد` };
  }
  return { isValid: true };
}

/**
 * Validates positive number / amount
 */
export function validateAmount(amount: number | string, isRequired: boolean = true): { isValid: boolean; error?: string } {
  const clean = toEnglishDigits(String(amount || '')).replace(/,/g, '').trim();
  if (!clean) {
    if (isRequired) return { isValid: false, error: 'مبلغ الزامی است' };
    return { isValid: true };
  }
  const num = Number(clean);
  if (isNaN(num) || num < 0) {
    return { isValid: false, error: 'مبلغ وارد شده معتبر نیست' };
  }
  return { isValid: true };
}

/**
 * Formats a number with thousand separators and Toman currency label
 * e.g., 1500000 -> "۱,۵۰۰,۰۰۰ تومان"
 */
export function formatCurrencyToman(amount: number | undefined | null, includeUnit: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeUnit ? `۰ تومان` : '۰';
  }
  const parts = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const persianParts = toPersianDigits(parts);
  return includeUnit ? `${persianParts} تومان` : persianParts;
}

/**
 * Formats user input as they type numbers with thousand separators
 */
export function formatNumberInput(value: string): string {
  const clean = toEnglishDigits(value).replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse thousand separated input to number
 */
export function parseNumberInput(value: string): number {
  const clean = toEnglishDigits(value).replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}
