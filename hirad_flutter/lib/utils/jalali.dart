import 'validation.dart';

/// Pure Dart Jalali (Shamsi) Solar Calendar Engine.
/// Implements astronomical Gregorian <-> Jalali conversion, leap years,
/// formatting, age computation, and membership duration calculations.

class JalaliDate {
  final int year;
  final int month;
  final int day;

  const JalaliDate({required this.year, required this.month, required this.day});

  String get formatted =>
      '$year/${month.toString().padLeft(2, '0')}/${day.toString().padLeft(2, '0')}';

  String get formattedPersian => ValidationUtils.toPersianDigits(formatted);

  @override
  String toString() => formatted;
}

class JalaliUtils {
  static const List<String> monthNames = [
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

  static const List<String> weekDays = [
    'شنبه',
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
  ];

  /// Checks whether a Jalali year is a leap year using the astronomical 33-year cycle.
  static bool isJalaliLeapYear(int jy) {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    var jp = breaks[0];
    var jump = 0;
    if (jy < jp || jy >= breaks.last) {
      return ((jy - 1300) % 4 == 3);
    }
    for (var i = 1; i < breaks.length; i++) {
      final jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      jp = jm;
    }
    var n = jy - jp;
    if (jump - n < 6) n = n - jump + ((jump + 4) >> 5) * 33;
    var leap = ((n + 1) % 33) - 1;
    if (leap == -1) leap = 4;
    return leap % 4 == 0;
  }

  /// Returns the number of days in a given Jalali month.
  static int getDaysInJalaliMonth(int year, int month) {
    if (month >= 1 && month <= 6) return 31;
    if (month >= 7 && month <= 11) return 30;
    if (month == 12) {
      return isJalaliLeapYear(year) ? 30 : 29;
    }
    return 30;
  }

  /// Converts Gregorian date to Jalali date.
  static JalaliDate gregorianToJalali(int gy, int gm, int gd) {
    const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    final gy2 = gm > 2 ? gy + 1 : gy;
    var days = 355666 +
        (365 * gy) +
        ((gy2 + 3) ~/ 4) -
        ((gy2 + 99) ~/ 100) +
        ((gy2 + 399) ~/ 400) +
        gd +
        gdm[gm - 1];
    var jy = -1595 + 33 * (days ~/ 12053);
    days %= 12053;
    jy += 4 * (days ~/ 1461);
    days %= 1461;
    if (days > 365) {
      jy += (days - 1) ~/ 365;
      days = (days - 1) % 365;
    }
    int jm;
    int jd;
    if (days < 186) {
      jm = 1 + (days ~/ 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + ((days - 186) ~/ 30);
      jd = 1 + ((days - 186) % 30);
    }
    return JalaliDate(year: jy, month: jm, day: jd);
  }

  /// Converts Jalali date to Gregorian date.
  static DateTime jalaliToGregorian(int jy, int jm, int jd) {
    final jy2 = jy - 979;
    var days = 365 * jy2 +
        (jy2 ~/ 33) * 8 +
        (((jy2 % 33) + 3) ~/ 4) +
        78 +
        jd +
        (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

    var gy = 1600 + 400 * (days ~/ 146097);
    days %= 146097;
    var leap = true;
    if (days >= 36525) {
      days--;
      gy += 100 * (days ~/ 36524);
      days %= 36524;
      if (days >= 365) {
        days++;
      } else {
        leap = false;
      }
    }
    gy += 4 * (days ~/ 1461);
    days %= 1461;
    if (days >= 366) {
      leap = false;
      days--;
      gy += (days ~/ 365);
      days %= 365;
    }

    final gdm = [0, 31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm = 0;
    while (gm < 12 && days >= gdm[gm + 1]) {
      days -= gdm[gm + 1];
      gm++;
    }
    final gd = days + 1;
    return DateTime(gy, gm + 1, gd);
  }

  /// Returns today's Jalali date.
  static JalaliDate getTodayJalali() {
    final now = DateTime.now();
    return gregorianToJalali(now.year, now.month, now.day);
  }

  /// Formats date string (YYYY/MM/DD) into friendly Persian text.
  /// e.g. "1378/05/14" -> "۱۴ مرداد ۱۳۷۸"
  static String formatJalaliPretty(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    final clean = ValidationUtils.toEnglishDigits(dateStr);
    final parts = clean.split(RegExp(r'[\/\-]'));
    if (parts.length < 3) return dateStr;
    final y = int.tryParse(parts[0]) ?? 1370;
    final m = int.tryParse(parts[1]) ?? 1;
    final d = int.tryParse(parts[2]) ?? 1;
    final monthName = (m >= 1 && m <= 12) ? monthNames[m - 1] : '';
    return '${ValidationUtils.toPersianDigits(d)} $monthName ${ValidationUtils.toPersianDigits(y)}';
  }

  /// Calculates age from Jalali birth date.
  static String calculateAge(String? birthDateStr) {
    if (birthDateStr == null || birthDateStr.isEmpty) return '';
    try {
      final clean = ValidationUtils.toEnglishDigits(birthDateStr);
      final parts = clean.split(RegExp(r'[\/\-]')).map(int.parse).toList();
      final by = parts[0];
      final bm = parts[1];
      final bd = parts[2];
      final today = getTodayJalali();

      var age = today.year - by;
      if (today.month < bm || (today.month == bm && today.day < bd)) {
        age--;
      }
      return '${ValidationUtils.toPersianDigits(age)} سال';
    } catch (_) {
      return '';
    }
  }

  /// Calculates membership duration from registration date.
  static String calculateMembershipDuration(String? regDateStr) {
    if (regDateStr == null || regDateStr.isEmpty) return '';
    try {
      final clean = ValidationUtils.toEnglishDigits(regDateStr);
      final parts = clean.split(RegExp(r'[\/\-]')).map(int.parse).toList();
      final ry = parts[0];
      final rm = parts[1];
      final rd = parts[2];
      final today = getTodayJalali();

      var months = (today.year - ry) * 12 + (today.month - rm);
      if (today.day < rd) {
        months--;
      }
      if (months <= 0) {
        return 'عضویت جدید (کمتر از ۱ ماه)';
      }
      if (months < 12) {
        return '${ValidationUtils.toPersianDigits(months)} ماه عضویت';
      }
      final years = months ~/ 12;
      final remMonths = months % 12;
      if (remMonths == 0) {
        return '${ValidationUtils.toPersianDigits(years)} سال عضویت';
      }
      return '${ValidationUtils.toPersianDigits(years)} سال و ${ValidationUtils.toPersianDigits(remMonths)} ماه عضویت';
    } catch (_) {
      return '';
    }
  }
}
