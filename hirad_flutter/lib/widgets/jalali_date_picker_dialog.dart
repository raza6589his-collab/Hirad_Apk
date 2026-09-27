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
  bool _showYearPicker = false;
  final TextEditingController _yearSearchController = TextEditingController();

  final List<Map<String, dynamic>> _decades = [
    {'label': 'دهه ۵۰', 'year': 1350},
    {'label': 'دهه ۶۰', 'year': 1360},
    {'label': 'دهه ۷۰', 'year': 1370},
    {'label': 'دهه ۸۰', 'year': 1380},
    {'label': 'دهه ۹۰', 'year': 1390},
    {'label': 'دهه ۴۰', 'year': 1340},
    {'label': '۱۴۰۰', 'year': 1400},
  ];

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

  @override
  void dispose() {
    _yearSearchController.dispose();
    super.dispose();
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
      _showYearPicker = false;
    });
  }

  int _getFirstDayOfWeekOffset() {
    final greg = JalaliUtils.jalaliToGregorian(_selectedYear, _selectedMonth, 1);
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
          width: 330,
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
                  if (!_showYearPicker)
                    IconButton(
                      icon: const Icon(Icons.chevron_right),
                      onPressed: _onNextMonth,
                      tooltip: 'ماه بعد',
                    )
                  else
                    const SizedBox(width: 40),
                  Row(
                    children: [
                      Text(
                        JalaliUtils.monthNames[_selectedMonth - 1],
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () {
                          setState(() {
                            _showYearPicker = !_showYearPicker;
                          });
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _showYearPicker
                                ? AppColors.brand500
                                : (isDark ? AppColors.darkBorder : AppColors.lightSubtle),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                ValidationUtils.toPersianDigits(_selectedYear),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: _showYearPicker ? Colors.white : null,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                _showYearPicker ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                                size: 16,
                                color: _showYearPicker ? Colors.white : Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (!_showYearPicker)
                    IconButton(
                      icon: const Icon(Icons.chevron_left),
                      onPressed: _onPrevMonth,
                      tooltip: 'ماه قبل',
                    )
                  else
                    const SizedBox(width: 40),
                ],
              ),
              const SizedBox(height: 8),

              if (_showYearPicker) ...[
                // Year Search and Decades
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: TextField(
                    controller: _yearSearchController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'تایپ یا جستجوی سال (مثلاً ۱۳۶۵)...',
                      hintStyle: const TextStyle(fontSize: 11),
                      prefixIcon: const Icon(Icons.search, size: 18),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onChanged: (val) {
                      setState(() {});
                      final clean = ValidationUtils.toEnglishDigits(val).trim();
                      if (clean.length == 4) {
                        final y = int.tryParse(clean);
                        if (y != null && y >= widget.minYear && y <= widget.maxYear) {
                          setState(() {
                            _selectedYear = y;
                            _showYearPicker = false;
                            _yearSearchController.clear();
                          });
                        }
                      }
                    },
                  ),
                ),
                const SizedBox(height: 6),

                // Decade quick chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _decades.map((d) {
                      return Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: ActionChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                            d['label'] as String,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                          onPressed: () {
                            setState(() {
                              _selectedYear = d['year'] as int;
                              _showYearPicker = false;
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 6),

                // Year Grid
                SizedBox(
                  height: 200,
                  child: Builder(builder: (context) {
                    final query = ValidationUtils.toEnglishDigits(_yearSearchController.text).trim();
                    final allYears = List.generate(
                      widget.maxYear - widget.minYear + 1,
                      (index) => widget.maxYear - index,
                    );
                    final filtered = query.isNotEmpty
                        ? allYears.where((y) => y.toString().contains(query)).toList()
                        : allYears;

                    return GridView.builder(
                      itemCount: filtered.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        childAspectRatio: 1.6,
                        crossAxisSpacing: 6,
                        mainAxisSpacing: 6,
                      ),
                      itemBuilder: (ctx, idx) {
                        final y = filtered[idx];
                        final isSel = y == _selectedYear;
                        return InkWell(
                          onTap: () {
                            setState(() {
                              _selectedYear = y;
                              _showYearPicker = false;
                              _yearSearchController.clear();
                            });
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.brand500 : (isDark ? AppColors.darkSubtle : Colors.grey[200]),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              ValidationUtils.toPersianDigits(y),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isSel ? Colors.white : (isDark ? Colors.white : Colors.black87),
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }),
                ),
              ] else ...[
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
                  itemCount: totalDays + offset,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    childAspectRatio: 1.0,
                    crossAxisSpacing: 4,
                    mainAxisSpacing: 4,
                  ),
                  itemBuilder: (ctx, index) {
                    if (index < offset) {
                      return const SizedBox.shrink();
                    }
                    final dayNum = index - offset + 1;
                    final isSelected = dayNum == _selectedDay;
                    final isToday = dayNum == today.day &&
                        _selectedMonth == today.month &&
                        _selectedYear == today.year;
                    final isFriday = index % 7 == 6;

                    return InkWell(
                      onTap: () => setState(() => _selectedDay = dayNum),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.brand500
                              : isToday
                                  ? (isDark ? AppColors.brand600.withOpacity(0.3) : AppColors.brand50)
                                  : null,
                          border: isToday && !isSelected
                              ? Border.all(color: AppColors.brand500, width: 1.5)
                              : null,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Center(
                          child: Text(
                            ValidationUtils.toPersianDigits(dayNum),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected || isToday ? FontWeight.bold : FontWeight.normal,
                              color: isSelected
                                  ? Colors.white
                                  : isFriday
                                      ? AppColors.debt
                                      : isDark
                                          ? Colors.white
                                          : Colors.black87,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
              const SizedBox(height: 12),

              // Bottom Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    icon: const Icon(Icons.today, size: 16),
                    label: const Text('امروز', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: _setToday,
                  ),
                  Row(
                    children: [
                      TextButton(
                        child: const Text('انصراف', style: TextStyle(fontSize: 12)),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 4),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brand500,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text('تایید', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          final formatted =
                              '$_selectedYear/${_selectedMonth.toString().padLeft(2, '0')}/${_selectedDay.toString().padLeft(2, '0')}';
                          Navigator.pop(context, formatted);
                        },
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
