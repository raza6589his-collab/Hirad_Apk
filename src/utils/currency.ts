import { toPersianDigits, toEnglishDigits } from './jalali';

/**
 * Hirad Fitness App - Currency & Number Formatting Utility
 * Handles standard Iranian Rial/Toman displays with Persian numerals,
 * thousand separators, and non-breaking space before "تومان".
 */

/**
 * Formats a numeric amount to Persian digits with thousand separators and optional "تومان" unit.
 * Keeps a non-breaking space (\u00A0) between the number and "تومان".
 * e.g., 1500000 -> "۱,۵۰۰,۰۰۰ تومان"
 */
export function formatCurrencyToman(
  amount: number | undefined | null,
  includeUnit: boolean = true
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeUnit ? `۰\u00A0تومان` : '۰';
  }

  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);

  const parts = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const persianParts = toPersianDigits(parts);

  const numText = isNegative ? `-${persianParts}` : persianParts;

  return includeUnit ? `${numText}\u00A0تومان` : numText;
}

/**
 * Formats signed transaction amounts with explicit '+' or '-' sign,
 * preserving correct RTL/LTR rendering with \u200E (Left-to-Right Mark).
 * e.g. + 1500000 -> "+ ۱,۵۰۰,۰۰۰ تومان"
 *      - 500000  -> "- ۵۰۰,۰۰۰ تومان"
 */
export function formatSignedCurrencyToman(
  amount: number | undefined | null,
  isPositive: boolean = true
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `۰\u00A0تومان`;
  }

  const absVal = Math.abs(Math.round(amount));
  const parts = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const persianParts = toPersianDigits(parts);
  const sign = isPositive ? '+' : '-';

  // \u200E ensures the sign and digits maintain strict LTR order inside RTL context
  return `\u200E${sign} ${persianParts}\u00A0تومان`;
}

/**
 * Formats raw number strings or numbers with thousand separators and Persian digits.
 * e.g., 1500000 -> "۱,۵۰۰,۰۰۰"
 */
export function formatThousandsPersian(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const clean = toEnglishDigits(String(value)).replace(/[^0-9]/g, '');
  if (!clean) return '';
  const separated = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(separated);
}

/**
 * Formats user input as they type numbers with thousand separators (English digits for input values)
 */
export function formatNumberInput(value: string): string {
  const clean = toEnglishDigits(value).replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse thousand separated input or Persian numeral input to number
 */
export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const clean = toEnglishDigits(String(value)).replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}
