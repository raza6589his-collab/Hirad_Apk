import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../utils/jalali.dart';
import '../utils/validation.dart';

class JalaliDatePickerDialog extends StatefulWidget {
  final String initialDate; // YYYY/MM/DD
  final int minYear;
  final int maxYear;
  final String title;

  const JalaliDatePickerDialog({
    super.key,
    required this.initialDate,
    this.minYear = 1330,
    this.maxYear = 1415,
    this.title = 'انتخاب تاریخ',
  });

  @override
  State<JalaliDatePickerDialog> createState() => _JalaliDatePickerDialogState();
}

class _JalaliDatePickerDialogState extends State<JalaliDatePickerDialog> {
  late int _selectedYear;
  late int _selectedMonth;
  late int _selectedDay;

  @override
  void initState() {
    super.initState();
    final today = JalaliUtils.getTodayJalali();
    try {
      final clean = ValidationUtils.toEnglishDigits(widget.initialDate);
      final parts = clean.split(RegExp(r'[\/\-]')).map(int.parse).toList();
      _selectedYear = parts[0];
      _selectedMonth = parts[1];
      _selectedDay = parts[2];
    } catch (_) {
      _selectedYear = today.year;
      _selectedMonth = today.month;
      _selectedDay = today.day;
    }
  }

  void _onPrevMonth() {
    setState(() {
      if (_selectedMonth == 1) {
        _selectedYear--;
        _selectedMonth = 12;
      } else {
        _selectedMonth--;
      }
      _checkDayBounds();
    });
  }

  void _onNextMonth() {
    setState(() {
      if (_selectedMonth == 12) {
        _selectedYear++;
        _selectedMonth = 1;
      } else {
        _selectedMonth++;
      }
      _checkDayBounds();
    });
  }

  void _checkDayBounds() {
    final maxDays = JalaliUtils.getDaysInJalaliMonth(_selectedYear, _selectedMonth);
    if (_selectedDay > maxDays) {
      _selectedDay = maxDays;
    }
  }

  void _setToday() {
    final today = JalaliUtils.getTodayJalali();
    setState(() {
      _selectedYear = today.year;
      _selectedMonth = today.month;
      _selectedDay = today.day;
    });
  }

  int _getFirstDayOfWeekOffset() {
    final greg = JalaliUtils.jalaliToGregorian(_selectedYear, _selectedMonth, 1);
    // Sunday=7 in Dart DateTime (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun)
    // Persian starts Saturday (شنبه) -> 0 offset
    // Sat=6 -> (6+1)%7 = 0
    // Sun=7 -> (7+1)%7 = 1
    // Mon=1 -> (1+1)%7 = 2
    return (greg.weekday + 1) % 7;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalDays = JalaliUtils.getDaysInJalaliMonth(_selectedYear, _selectedMonth);
    final offset = _getFirstDayOfWeekOffset();
    final today = JalaliUtils.getTodayJalali();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        child: Container(
          width: 320,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.brand600, AppColors.brand500],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${ValidationUtils.toPersianDigits(_selectedDay)} ${JalaliUtils.monthNames[_selectedMonth - 1]} ${ValidationUtils.toPersianDigits(_selectedYear)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Month & Year Selector Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: _onNextMonth,
                    tooltip: 'ماه بعد',
                  ),
                  Row(
                    children: [
                      Text(
                        JalaliUtils.monthNames[_selectedMonth - 1],
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ValidationUtils.toPersianDigits(_selectedYear),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: _onPrevMonth,
                    tooltip: 'ماه قبل',
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Weekday names
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((w) {
                  return SizedBox(
                    width: 34,
                    child: Center(
                      child: Text(
                        w,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: w == 'ج' ? AppColors.debt : Colors.grey[500],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 6),

              // Days Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  mainAxisSpacing: 4,
                  crossAxisSpacing: 4,
                ),
                itemCount: offset + totalDays,
                itemBuilder: (context, idx) {
                  if (idx < offset) return const SizedBox.shrink();
                  final dayNum = idx - offset + 1;
                  final isSelected = dayNum == _selectedDay;
                  final isToday = dayNum == today.day &&
                      _selectedMonth == today.month &&
                      _selectedYear == today.year;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedDay = dayNum),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.brand500
                            : (isToday ? AppColors.brand500.withOpacity(0.15) : Colors.transparent),
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        border: isToday && !isSelected
                            ? Border.all(color: AppColors.brand500, width: 1.5)
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        ValidationUtils.toPersianDigits(dayNum),
                        style: TextStyle(
                          color: isSelected ? Colors.white : null,
                          fontWeight: isSelected || isToday ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),
              // Footer Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    icon: const Icon(Icons.restore, size: 16),
                    label: const Text('امروز', style: TextStyle(fontSize: 12)),
                    onPressed: _setToday,
                  ),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('انصراف', style: TextStyle(fontSize: 12)),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brand500,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                        ),
                        onPressed: () {
                          final formatted =
                              '$_selectedYear/${_selectedMonth.toString().padLeft(2, '0')}/${_selectedDay.toString().padLeft(2, '0')}';
                          Navigator.pop(context, formatted);
                        },
                        child: const Text('تایید', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
