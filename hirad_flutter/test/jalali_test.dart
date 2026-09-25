import 'package:test/test.dart';
import '../lib/utils/jalali.dart';

void main() {
  group('Jalali Calendar Engine Tests', () {
    test('Gregorian to Jalali known reference dates', () {
      // 2024-03-20 -> 1403/01/01 (Nowruz 1403)
      final nowruz1403 = JalaliUtils.gregorianToJalali(2024, 3, 20);
      expect(nowruz1403.year, equals(1403));
      expect(nowruz1403.month, equals(1));
      expect(nowruz1403.day, equals(1));

      // 1999-06-04 -> 1378/03/14
      final date1378 = JalaliUtils.gregorianToJalali(1999, 6, 4);
      expect(date1378.year, equals(1378));
      expect(date1378.month, equals(3));
      expect(date1378.day, equals(14));
    });

    test('Jalali to Gregorian round-trip accuracy', () {
      final greg = JalaliUtils.jalaliToGregorian(1378, 3, 14);
      expect(greg.year, equals(1999));
      expect(greg.month, equals(6));
      expect(greg.day, equals(4));

      final roundTrip = JalaliUtils.gregorianToJalali(greg.year, greg.month, greg.day);
      expect(roundTrip.year, equals(1378));
      expect(roundTrip.month, equals(3));
      expect(roundTrip.day, equals(14));
    });

    test('Days in month rules', () {
      // First 6 months: 31 days
      for (var m = 1; m <= 6; m++) {
        expect(JalaliUtils.getDaysInJalaliMonth(1403, m), equals(31));
      }
      // Months 7 to 11: 30 days
      for (var m = 7; m <= 11; m++) {
        expect(JalaliUtils.getDaysInJalaliMonth(1403, m), equals(30));
      }
      // Month 12: 29 days in normal year, 30 in leap year
      // 1399 was leap year -> 30 days
      expect(JalaliUtils.getDaysInJalaliMonth(1399, 12), equals(30));
      // 1401 was normal year -> 29 days
      expect(JalaliUtils.getDaysInJalaliMonth(1401, 12), equals(29));
    });

    test('Pretty formatting in Persian', () {
      final pretty = JalaliUtils.formatJalaliPretty('1378/05/14');
      expect(pretty, contains('مرداد'));
      expect(pretty, contains('۱۳۷۸'));
    });
  });
}
