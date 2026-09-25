import 'package:test/test.dart';
import '../lib/utils/validation.dart';

void main() {
  group('Iranian National Code Checksum Tests', () {
    test('Valid National IDs pass official checksum', () {
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
        expect(res.isValid, isTrue, reason: 'Failed for valid code $code');
      }
    });

    test('National IDs with Persian digits pass checksum', () {
      final res = ValidationUtils.validateNationalId('۰۰۱۲۳۴۵۶۷۹');
      expect(res.isValid, isTrue);
    });

    test('Identical digits are rejected', () {
      final invalidCodes = [
        '0000000000',
        '1111111111',
        '2222222222',
        '9999999999',
      ];

      for (final code in invalidCodes) {
        final res = ValidationUtils.validateNationalId(code);
        expect(res.isValid, isFalse, reason: 'Identical code $code should be rejected');
      }
    });

    test('Invalid checksum digits are rejected', () {
      final invalidCodes = [
        '0012345678', // Correct is 9
        '0081234569', // Correct is 2
        '1234567890',
      ];

      for (final code in invalidCodes) {
        final res = ValidationUtils.validateNationalId(code);
        expect(res.isValid, isFalse, reason: 'Invalid checksum $code should fail');
      }
    });

    test('Invalid length is rejected', () {
      expect(ValidationUtils.validateNationalId('123456789').isValid, isFalse);
      expect(ValidationUtils.validateNationalId('12345678901').isValid, isFalse);
      expect(ValidationUtils.validateNationalId('').isValid, isFalse);
    });
  });

  group('Iranian Mobile Number Tests', () {
    test('Valid 09 mobile numbers pass', () {
      expect(ValidationUtils.validateMobileNumber('09121234567').isValid, isTrue);
      expect(ValidationUtils.validateMobileNumber('۰۹۱۹۸۷۶۵۴۳۲').isValid, isTrue);
    });

    test('Numbers not starting with 09 fail', () {
      expect(ValidationUtils.validateMobileNumber('08121234567').isValid, isFalse);
      expect(ValidationUtils.validateMobileNumber('02123456789').isValid, isFalse);
    });

    test('Numbers with wrong length fail', () {
      expect(ValidationUtils.validateMobileNumber('0912123456').isValid, isFalse);
      expect(ValidationUtils.validateMobileNumber('091212345678').isValid, isFalse);
    });
  });

  group('Currency & Digit Formatting Tests', () {
    test('Converts English to Persian digits correctly', () {
      expect(ValidationUtils.toPersianDigits(12345), equals('۱۲۳۴۵'));
      expect(ValidationUtils.toPersianDigits('0912'), equals('۰۹۱۲'));
    });

    test('Formats currency with thousand separators and Toman', () {
      expect(ValidationUtils.formatCurrencyToman(1500000), equals('۱,۵۰۰,۰۰۰ تومان'));
      expect(ValidationUtils.formatCurrencyToman(0), equals('۰ تومان'));
    });
  });
}
