import 'lib/utils/validation.dart';
import 'lib/utils/jalali.dart';

void main() {
  print('======================================================');
  print('🏃 RUNNING HIRAD FLUTTER CORE ALGORITHM TESTS');
  print('======================================================');

  var passed = 0;
  var failed = 0;

  void test(String name, void Function() body) {
    try {
      body();
      print('  ✅ PASS: $name');
      passed++;
    } catch (e, st) {
      print('  ❌ FAIL: $name\n     Error: $e\n$st');
      failed++;
    }
  }

  // Group 1: Iranian National Code Checksum Tests
  print('\n[1] Iranian National Code Checksum Validation:');
  test('Valid reference National Codes pass official checksum', () {
    final validCodes = [
      '0012345679',
      '0081234562',
      '0451234561',
      '0067891233',
      '0321234561',
      '0023456787',
    ];

    for (final code in validCodes) {
      final res = ValidationUtils.validateNationalId(code);
      if (!res.isValid) {
        throw Exception('Code $code failed: ${res.error}');
      }
    }
  });

  test('Persian numerals converted and validated correctly', () {
    final res = ValidationUtils.validateNationalId('۰۰۱۲۳۴۵۶۷۹');
    if (!res.isValid) {
      throw Exception('Persian numerals validation failed: ${res.error}');
    }
  });

  test('Identical digits (e.g. 1111111111) are rejected', () {
    final invalidCodes = [
      '0000000000',
      '1111111111',
      '2222222222',
      '9999999999',
    ];
    for (final code in invalidCodes) {
      final res = ValidationUtils.validateNationalId(code);
      if (res.isValid) {
        throw Exception('Identical code $code was unexpectedly accepted');
      }
    }
  });

  test('Incorrect checksum digits are rejected', () {
    final invalidChecksums = [
      '0012345678', // Correct check digit is 9
      '0081234569', // Correct check digit is 2
      '1234567890',
    ];
    for (final code in invalidChecksums) {
      final res = ValidationUtils.validateNationalId(code);
      if (res.isValid) {
        throw Exception('Invalid checksum code $code was accepted');
      }
    }
  });

  test('Invalid lengths are rejected', () {
    assert(!ValidationUtils.validateNationalId('123456789').isValid);
    assert(!ValidationUtils.validateNationalId('12345678901').isValid);
    assert(!ValidationUtils.validateNationalId('').isValid);
  });

  // Group 2: Mobile Number Tests
  print('\n[2] Iranian Mobile Number Validation:');
  test('Valid 09 mobile numbers pass', () {
    assert(ValidationUtils.validateMobileNumber('09121234567').isValid);
    assert(ValidationUtils.validateMobileNumber('۰۹۱۹۸۷۶۵۴۳۲').isValid);
  });

  test('Invalid mobile numbers fail', () {
    assert(!ValidationUtils.validateMobileNumber('08121234567').isValid);
    assert(!ValidationUtils.validateMobileNumber('0912').isValid);
  });

  // Group 3: Jalali Calendar Tests
  print('\n[3] Jalali Calendar Engine Tests:');
  test('Gregorian to Jalali known reference dates (Nowruz 1403)', () {
    final nowruz1403 = JalaliUtils.gregorianToJalali(2024, 3, 20);
    assert(nowruz1403.year == 1403);
    assert(nowruz1403.month == 1);
    assert(nowruz1403.day == 1);
  });

  test('Jalali round-trip astronomical accuracy', () {
    final greg = JalaliUtils.jalaliToGregorian(1378, 3, 14);
    assert(greg.year == 1999);
    assert(greg.month == 6);
    assert(greg.day == 4);

    final roundTrip = JalaliUtils.gregorianToJalali(greg.year, greg.month, greg.day);
    assert(roundTrip.year == 1378);
    assert(roundTrip.month == 3);
    assert(roundTrip.day == 14);
  });

  test('Month lengths (31, 30, and 29/30 leap year days)', () {
    // Months 1..6 have 31 days
    for (var m = 1; m <= 6; m++) {
      assert(JalaliUtils.getDaysInJalaliMonth(1403, m) == 31);
    }
    // Months 7..11 have 30 days
    for (var m = 7; m <= 11; m++) {
      assert(JalaliUtils.getDaysInJalaliMonth(1403, m) == 30);
    }
    // Month 12: 30 days in leap year 1399, 29 in normal year 1401
    assert(JalaliUtils.getDaysInJalaliMonth(1399, 12) == 30);
    assert(JalaliUtils.getDaysInJalaliMonth(1401, 12) == 29);
  });

  test('Pretty formatting in Persian', () {
    final pretty = JalaliUtils.formatJalaliPretty('1378/05/14');
    assert(pretty.contains('مرداد'));
    assert(pretty.contains('۱۳۷۸'));
  });

  // Group 4: Currency formatting
  print('\n[4] Currency Formatting Tests:');
  test('Toman currency with thousand separators and Persian digits', () {
    final formatted = ValidationUtils.formatCurrencyToman(1500000);
    assert(formatted == '۱,۵۰۰,۰۰۰ تومان');
  });

  print('\n======================================================');
  print('🏁 SUMMARY: $passed Passed | $failed Failed');
  print('======================================================');
  if (failed > 0) {
    throw Exception('$failed tests failed');
  }
}
