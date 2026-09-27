import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/athlete.dart';
import '../data/athlete_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/avatar.dart';
import '../widgets/alphabet_quick_index.dart';
import '../widgets/theme_toggle_button.dart';
import '../utils/validation.dart';
import '../utils/jalali.dart';
import 'athlete_profile_screen.dart';
import 'registration_form_screen.dart';

class AthleteListScreen extends StatefulWidget {
  final VoidCallback onToggleTheme;
  final bool isDarkMode;

  const AthleteListScreen({
    super.key,
    required this.onToggleTheme,
    required this.isDarkMode,
  });

  @override
  State<AthleteListScreen> createState() => _AthleteListScreenState();
}

class _AthleteListScreenState extends State<AthleteListScreen> {
  final AthleteRepository _repository = AthleteRepository();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  late final ConfettiController _confettiController;

  List<Athlete> _allAthletes = [];
  String _searchQuery = '';
  String _filterMode = 'all'; // 'all', 'debt', 'paid'
  String _sortMode = 'name-asc';
  bool _isSearchExpanded = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 2));
    _loadAthletes();

    // Check for update notification
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkUpdateNotification();
    });
  }

  void _checkUpdateNotification() {
    // Show new version notification to the coach
    _showUpdateNotificationDialog();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  Future<void> _loadAthletes() async {
    setState(() => _isLoading = true);
    final data = await _repository.getAthletes();
    setState(() {
      _allAthletes = data;
      _isLoading = false;
    });
  }

  List<Athlete> get _filteredAthletes {
    return _allAthletes.where((ath) {
      if (_filterMode == 'debt' && !ath.hasDebt) return false;
      if (_filterMode == 'paid' && ath.hasDebt) return false;

      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.trim().toLowerCase();
      return ath.fullName.toLowerCase().contains(q) ||
          ath.mobileNumber.contains(q) ||
          ath.nationalCode.contains(q);
    }).toList()
      ..sort((a, b) {
        if (_sortMode == 'name-asc') return a.fullName.compareTo(b.fullName);
        if (_sortMode == 'name-desc') return b.fullName.compareTo(a.fullName);
        if (_sortMode == 'debt-first') {
          return (b.tuitionUnpaid ?? 0).compareTo(a.tuitionUnpaid ?? 0);
        }
        return b.registrationDateJalali.compareTo(a.registrationDateJalali);
      });
  }

  List<String> get _availableLetters {
    if (_sortMode != 'name-asc') return [];
    final set = <String>{};
    for (final a in _filteredAthletes) {
      var first = a.firstName.trim().isNotEmpty ? a.firstName.trim()[0] : 'سایر';
      if (first == 'آ') first = 'ا';
      set.add(first);
    }
    return set.toList()..sort();
  }

  void _scrollToLetter(String letter) {
    final idx = _filteredAthletes.indexWhere((a) {
      var f = a.firstName.trim().isNotEmpty ? a.firstName.trim()[0] : '';
      if (f == 'آ') f = 'ا';
      return f == letter;
    });
    if (idx != -1 && _scrollController.hasClients) {
      _scrollController.animateTo(
        idx * 74.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _openAddModal() async {
    final result = await showModalBottomSheet<Athlete>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const RegistrationFormScreen(),
    );

    if (result != null) {
      await _repository.addAthlete(result);
      _confettiController.play();
      _loadAthletes();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${result.fullName} با موفقیت ثبت شد'),
            backgroundColor: AppColors.paid,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showQuickAttendanceDialog() {
    final natController = TextEditingController();
    Athlete? matched;
    String feedback = '';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final today = JalaliUtils.getTodayJalali();
          final now = DateTime.now();
          final timeStr =
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

          return Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
              title: Row(
                children: const [
                  Icon(Icons.how_to_reg, color: AppColors.paid, size: 24),
                  SizedBox(width: 8),
                  Text('ثبت سریع حضور ورزشکار', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'کد ملی ۱۰ رقمی ورزشکار را برای ثبت فوری ورود وارد کنید:',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: natController,
                    keyboardType: TextInputType.number,
                    textDirection: TextDirection.ltr,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2),
                    decoration: const InputDecoration(
                      hintText: '0012345679',
                      prefixIcon: Icon(Icons.credit_card),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (val) {
                      final clean = ValidationUtils.toEnglishDigits(val).trim();
                      if (clean.length >= 10) {
                        final found = _allAthletes.firstWhere(
                          (a) => a.nationalCode == clean,
                          orElse: () => Athlete(
                            id: '',
                            firstName: '',
                            lastName: '',
                            mobileNumber: '',
                            nationalCode: '',
                            birthDateJalali: '',
                            registrationDateJalali: '',
                            trainingCategory: '',
                            tuitionPaid: 0,
                            lastUpdated: DateTime.now(),
                          ),
                        );
                        setDialogState(() {
                          matched = found.id.isNotEmpty ? found : null;
                          feedback = found.id.isEmpty ? 'ورزشکاری با این کد ملی یافت نشد' : '';
                        });
                      } else {
                        setDialogState(() {
                          matched = null;
                          feedback = '';
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  if (matched != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSubtle : Colors.grey[100],
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(color: AppColors.paid.withOpacity(0.3)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              AthleteAvatar(
                                firstName: matched!.firstName,
                                lastName: matched!.lastName,
                                size: AvatarSize.sm,
                                heroTag: 'quick-att-${matched!.id}',
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      matched!.fullName,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    Text(
                                      '${matched!.trainingCategory} • ${matched!.mobileNumber}',
                                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'جلسه شماره ${ValidationUtils.toPersianDigits(matched!.attendances.length + 1)}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.paid),
                              ),
                              Text(
                                matched!.hasDebt
                                    ? 'بدهی: ${ValidationUtils.formatCurrencyToman(matched!.tuitionUnpaid)}'
                                    : 'شهریه تسویه',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: matched!.hasDebt ? AppColors.debt : AppColors.paid,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.paid,
                                foregroundColor: Colors.white,
                              ),
                              icon: const Icon(Icons.check_circle),
                              label: const Text('ثبت ورود این جلسه'),
                              onPressed: () async {
                                final record = AttendanceRecord(
                                  id: 'att-${DateTime.now().millisecondsSinceEpoch}',
                                  date: today.formatted,
                                  time: timeStr,
                                  sessionNumber: matched!.attendances.length + 1,
                                );
                                final updated = matched!.copyWith(
                                  attendances: [record, ...matched!.attendances],
                                  lastUpdated: DateTime.now(),
                                );
                                await _repository.updateAthlete(updated);
                                _confettiController.play();
                                _loadAthletes();
                                if (mounted) {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'ورود ${matched!.fullName} برای جلسه شماره ${record.sessionNumber} ثبت شد ✅',
                                      ),
                                      backgroundColor: AppColors.paid,
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else if (feedback.isNotEmpty) ...[
                    Text(
                      feedback,
                      style: const TextStyle(fontSize: 12, color: AppColors.debt, fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  child: const Text('بستن'),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showUpdateNotificationDialog() {
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
          title: Row(
            children: const [
              Icon(Icons.upgrade, color: AppColors.brand500, size: 24),
              SizedBox(width: 8),
              Text('بروزرسانی نسخه ۱.۱.۰ هیراد', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  'نسخه جدید اپلیکیشن باشگاه هیراد با قابلیت‌های جدید آماده است:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                SizedBox(height: 10),
                Text('⚡ انتخاب فوق‌سریع سال تولد با دهه‌ها و جستجوی مستقیم'),
                SizedBox(height: 6),
                Text('📱 اصلاح کیبورد و دید کامل ارقام در بخش شهریه'),
                SizedBox(height: 6),
                Text('💳 تفکیک شهریه ماه، ثبت واریزی‌ها و محاسبه خودکار بدهی'),
                SizedBox(height: 6),
                Text('⏱️ ثبت سریع حضور و غیاب با کد ملی در صفحه اصلی'),
                SizedBox(height: 6),
                Text('📋 محاسبه و نمایش سوابق جلسات حضور هر ورزشکار'),
                SizedBox(height: 6),
                Text('🖼️ امکان آپلود و تغییر عکس پروفایل از حافظه دستگاه'),
              ],
            ),
          ),
          actions: [
            TextButton(
              child: const Text('بعداً'),
              onPressed: () => Navigator.pop(ctx),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand500,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.download),
              label: const Text('دانلود نسخه جدید (APK)'),
              onPressed: () async {
                Navigator.pop(ctx);
                final uri = Uri.parse('https://github.com/raza6589his-collab/Hirad_Apk/releases/latest');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(Athlete athlete) {
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text('حذف ورزشکار', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text('آیا از حذف پرونده ${athlete.fullName} اطمینان دارید؟'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('انصراف'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.debt,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                Navigator.pop(ctx);
                await _repository.deleteAthlete(athlete.id);
                _loadAthletes();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('پرونده ${athlete.fullName} حذف شد'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              child: const Text('حذف'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDarkMode;
    final filtered = _filteredAthletes;
    final letters = _availableLetters;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.brand600, Colors.amber],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: const Icon(Icons.fitness_center, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'باشگاه هیراد',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.brand500.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                          border: Border.all(color: AppColors.brand500.withOpacity(0.3)),
                        ),
                        child: const Text(
                          'مربی',
                          style: TextStyle(
                            color: AppColors.brand600,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${ValidationUtils.toPersianDigits(_allAthletes.length)} ورزشکار ثبت شده',
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            // Quick Attendance Button
            IconButton(
              icon: const Icon(Icons.how_to_reg, color: AppColors.paid),
              tooltip: 'ثبت سریع حضور با کد ملی',
              onPressed: _showQuickAttendanceDialog,
            ),
            // Update Notification Bell
            IconButton(
              icon: const Icon(Icons.notifications_active, color: AppColors.brand500),
              tooltip: 'اعلان نسخه جدید برنامه',
              onPressed: _showUpdateNotificationDialog,
            ),
            // Search button
            IconButton(
              icon: Icon(_isSearchExpanded ? Icons.close : Icons.search),
              onPressed: () {
                setState(() {
                  _isSearchExpanded = !_isSearchExpanded;
                  if (!_isSearchExpanded) {
                    _searchController.clear();
                    _searchQuery = '';
                  }
                });
              },
            ),
            // Sort button
            IconButton(
              icon: const Icon(Icons.sort),
              tooltip: 'مرتب‌سازی',
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  builder: (ctx) => Directionality(
                    textDirection: TextDirection.rtl,
                    child: SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: const Icon(Icons.sort_by_alpha),
                            title: const Text('الفبا (الف تا ی)'),
                            selected: _sortMode == 'name-asc',
                            onTap: () {
                              setState(() => _sortMode = 'name-asc');
                              Navigator.pop(ctx);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.sort_by_alpha),
                            title: const Text('الفبا (ی تا الف)'),
                            selected: _sortMode == 'name-desc',
                            onTap: () {
                              setState(() => _sortMode = 'name-desc');
                              Navigator.pop(ctx);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.money_off),
                            title: const Text('ابتدا بدهکاران'),
                            selected: _sortMode == 'debt-first',
                            onTap: () {
                              setState(() => _sortMode = 'debt-first');
                              Navigator.pop(ctx);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            // Theme toggle button
            ThemeToggleButton(
              isDark: widget.isDarkMode,
              onToggle: widget.onToggleTheme,
            ),
          ],
        ),
        body: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadAthletes,
              color: AppColors.brand500,
              child: Column(
                children: [
                  // Live Search Input (if expanded)
                  if (_isSearchExpanded)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText: 'جستجو بر اساس نام، موبایل یا کد ملی...',
                          prefixIcon: const Icon(Icons.search),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                        onChanged: (val) => setState(() => _searchQuery = val),
                      ),
                    ),

                  // Filter Chips Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        _buildFilterChip('all', 'همه (${ValidationUtils.toPersianDigits(_allAthletes.length)})'),
                        const SizedBox(width: 8),
                        _buildFilterChip('debt', 'دارای بدهی'),
                        const SizedBox(width: 8),
                        _buildFilterChip('paid', 'تسویه کامل'),
                      ],
                    ),
                  ),

                  // Athlete List / Empty State
                  Expanded(
                    child: _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : filtered.isEmpty
                            ? _buildEmptyState()
                            : Stack(
                                children: [
                                  ListView.separated(
                                    controller: _scrollController,
                                    physics: const AlwaysScrollableScrollPhysics(),
                                    itemCount: filtered.length,
                                    separatorBuilder: (_, __) => Divider(
                                      height: 1,
                                      indent: 72,
                                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                    ),
                                    itemBuilder: (ctx, index) {
                                      final athlete = filtered[index];
                                      return _buildAthleteRow(athlete);
                                    },
                                  ),
                                  // Alphabet quick-index bar (if name-asc)
                                  if (letters.length > 1)
                                    Positioned(
                                      top: 10,
                                      bottom: 10,
                                      right: 0,
                                      child: AlphabetQuickIndex(
                                        availableLetters: letters,
                                        onLetterSelected: _scrollToLetter,
                                      ),
                                    ),
                                ],
                              ),
                  ),
                ],
              ),
            ),

            // Confetti
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _confettiController,
                blastDirectionality: BlastDirectionality.explosive,
                shouldLoop: false,
                colors: const [
                  AppColors.brand500,
                  AppColors.paid,
                  Colors.blue,
                  Colors.amber,
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          backgroundColor: AppColors.brand500,
          foregroundColor: Colors.white,
          onPressed: _openAddModal,
          tooltip: 'افزودن ورزشکار',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String mode, String label) {
    final isSelected = _filterMode == mode;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.brand500,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : null,
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
      onSelected: (_) => setState(() => _filterMode = mode),
    );
  }

  Widget _buildAthleteRow(Athlete athlete) {
    final isDark = widget.isDarkMode;
    final heroTag = 'avatar-${athlete.id}';

    return Dismissible(
      key: Key(athlete.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        color: AppColors.debt,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (dir) async {
        _confirmDelete(athlete);
        return false;
      },
      child: InkWell(
        onTap: () async {
          final changed = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (ctx) => AthleteProfileScreen(athleteId: athlete.id),
            ),
          );
          if (changed == true) {
            _loadAthletes();
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              // Avatar
              AthleteAvatar(
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                photoPath: athlete.photoPath,
                size: AvatarSize.md,
                heroTag: heroTag,
                hasDebt: athlete.hasDebt,
                showStatusBadge: true,
              ),
              const SizedBox(width: 14),

              // Full Name & Secondary info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      athlete.fullName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: athlete.hasDebt ? AppColors.debt : AppColors.paid,
                          ),
                        ),
                        const SizedBox(width: 6),
                        if (athlete.hasDebt)
                          Text(
                            'بدهی: ${ValidationUtils.formatCurrencyToman(athlete.tuitionUnpaid)}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.debt,
                            ),
                          )
                        else
                          const Text(
                            'تسویه کامل',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.paid,
                            ),
                          ),
                        const SizedBox(width: 6),
                        Text('•', style: TextStyle(color: Colors.grey[500])),
                        const SizedBox(width: 6),
                        Text(
                          ValidationUtils.toPersianDigits(athlete.mobileNumber),
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Trailing session count and registration date
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    ValidationUtils.toPersianDigits(
                      athlete.registrationDateJalali.split('/').skip(1).join('/'),
                    ),
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (athlete.attendances.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.paid.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: Text(
                            '${ValidationUtils.toPersianDigits(athlete.attendances.length)} جلسه',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.paid,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSubtle : Colors.grey[200],
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Text(
                          athlete.trainingCategory.split(' ').first,
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.grey[300] : Colors.grey[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.brand500.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.fitness_center, size: 40, color: AppColors.brand500),
            ),
            const SizedBox(height: 16),
            const Text(
              'هنوز ورزشکاری ثبت نشده است',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              'با زدن دکمه «ثبت اولین ورزشکار» شروع کنید',
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand500,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
              ),
              icon: const Icon(Icons.add),
              label: const Text('ثبت اولین ورزشکار', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: _openAddModal,
            ),
          ],
        ),
      ),
    );
  }
}
