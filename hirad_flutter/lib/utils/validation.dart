/// Iranian data format validation and currency formatting utilities.
/// Ported directly from the Hirad core engine with mathematical precision.

class ValidationResult {
  final bool isValid;
  final String? error;

  const ValidationResult({required this.isValid, this.error});
}

class ValidationUtils {
  static const List<String> _persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  static const List<String> _englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  /// Converts Persian and Arabic digits to standard ASCII English digits.
  static String toEnglishDigits(String? input) {
    if (input == null || input.isEmpty) return '';
    var str = input;
    for (var i = 0; i < 10; i++) {
      str = str.replaceAll(_persianDigits[i], _englishDigits[i]);
      // Arabic numerals (Unicode 1632-1641)
      str = str.replaceAll(String.fromCharCode(1632 + i), _englishDigits[i]);
    }
    return str;
  }

  /// Converts standard English digits to Persian digits.
  static String toPersianDigits(dynamic input) {
    if (input == null) return '';
    final str = input.toString();
    var result = str;
    for (var i = 0; i < 10; i++) {
      result = result.replaceAll(_englishDigits[i], _persianDigits[i]);
    }
    return result;
  }

  /// Validates Iranian National ID (کد ملی) according to the official checksum algorithm.
  /// 
  /// 1. Exactly 10 digits
  /// 2. Cannot be 10 identical digits (e.g. 1111111111)
  /// 3. Multiply each digit at index 0..8 by (10 - index)
  /// 4. Sum modulo 11
  /// 5. If remainder < 2: check digit == remainder
  /// 6. If remainder >= 2: check digit == 11 - remainder
  static ValidationResult validateNationalId(String? code) {
    if (code == null || code.trim().isEmpty) {
      return const ValidationResult(isValid: false, error: 'کد ملی الزامی است');
    }

    final cleanCode = toEnglishDigits(code.trim());

    if (!RegExp(r'^\d{10}$').hasMatch(cleanCode)) {
      return const ValidationResult(isValid: false, error: 'کد ملی باید ۱۰ رقم باشد');
    }

    // Check for repetitive digits (e.g., 0000000000, 1111111111, ..., 9999999999)
    final firstChar = cleanCode[0];
    if (cleanCode.split('').every((c) => c == firstChar)) {
      return const ValidationResult(isValid: false, error: 'کد ملی نامعتبر است (ارقام یکسان)');
    }

    // Official checksum algorithm
    final checkDigit = int.parse(cleanCode[9]);
    var sum = 0;
    for (var i = 0; i < 9; i++) {
      sum += int.parse(cleanCode[i]) * (10 - i);
    }

    final remainder = sum % 11;
    final isChecksumValid = (remainder < 2 && checkDigit == remainder) ||
        (remainder >= 2 && checkDigit == 11 - remainder);

    if (!isChecksumValid) {
      return const ValidationResult(
        isValid: false,
        error: 'کد ملی نامعتبر است (بررسی رقم کنترل شکست خورد)',
      );
    }

    return const ValidationResult(isValid: true);
  }

  /// Validates Iranian Mobile Phone Number.
  /// Must begin with 09 and contain exactly 11 digits.
  static ValidationResult validateMobileNumber(String? mobile) {
    if (mobile == null || mobile.trim().isEmpty) {
      return const ValidationResult(isValid: false, error: 'شماره موبایل الزامی است');
    }

    final cleanMobile = toEnglishDigits(mobile.trim().replaceAll(RegExp(r'[\s\-]'), ''));

    if (!RegExp(r'^09\d{9}$').hasMatch(cleanMobile)) {
      return const ValidationResult(
        isValid: false,
        error: 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود',
      );
    }

    return const ValidationResult(isValid: true);
  }

  /// Validates athlete name fields.
  static ValidationResult validateName(String? name, String fieldName) {
    if (name == null || name.trim().isEmpty) {
      return ValidationResult(isValid: false, error: '$fieldName الزامی است');
    }
    if (name.trim().length < 2) {
      return ValidationResult(isValid: false, error: '$fieldName باید حداقل ۲ حرف باشد');
    }
    return const ValidationResult(isValid: true);
  }

  /// Formats currency with thousand separators and optional Toman suffix.
  /// e.g. 1500000 -> "۱,۵۰۰,۰۰۰ تومان"
  static String formatCurrencyToman(num? amount, {bool includeUnit = true}) {
    if (amount == null) return includeUnit ? '۰ تومان' : '۰';
    final rounded = amount.round();
    final str = rounded.toString();
    final buffer = StringBuffer();
    final length = str.length;

    for (var i = 0; i < length; i++) {
      if (i > 0 && (length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(str[i]);
    }

    final persianParts = toPersianDigits(buffer.toString());
    return includeUnit ? '$persianParts تومان' : persianParts;
  }

  /// Formats numeric input as user types with thousand separators.
  static String formatNumberInput(String value) {
    final clean = toEnglishDigits(value).replaceAll(RegExp(r'[^0-9]'), '');
    if (clean.isEmpty) return '';
    final number = int.tryParse(clean) ?? 0;
    return formatCurrencyToman(number, includeUnit: false);
  }

  /// Parses thousand-separated string back to integer.
  static int parseNumberInput(String value) {
    final clean = toEnglishDigits(value).replaceAll(RegExp(r'[^0-9]'), '');
    return int.tryParse(clean) ?? 0;
  }
}
