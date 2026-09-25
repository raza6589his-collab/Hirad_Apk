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

  // Letters present in current list (scoped to active filtered results)
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
      // 72px item height estimation
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
            content: Text('ورزشکار جدید (${result.fullName}) با موفقیت ثبت شد'),
            backgroundColor: AppColors.paid,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _confirmDelete(Athlete athlete) {
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text('حذف ورزشکار', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text(
            'آیا از حذف پرونده ${athlete.fullName} اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
          ),
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
                            leading: const Icon(Icons.warning_amber),
                            title: const Text('بدهکاران در ابتدا'),
                            selected: _sortMode == 'debt-first',
                            onTap: () {
                              setState(() => _sortMode = 'debt-first');
                              Navigator.pop(ctx);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.access_time),
                            title: const Text('جدیدترین اعضا'),
                            selected: _sortMode == 'date-newest',
                            onTap: () {
                              setState(() => _sortMode = 'date-newest');
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
            // Theme toggle button with rotating morph
            ThemeToggleButton(
              isDark: isDark,
              onToggle: widget.onToggleTheme,
            ),
            const SizedBox(width: 8),
          ],
          bottom: PreferredSize(
            preferredSize: Size.fromHeight(_isSearchExpanded ? 104 : 52),
            child: Column(
              children: [
                if (_isSearchExpanded)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'جستجو در نام، شماره موبایل یا کد ملی...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        filled: true,
                        fillColor: isDark ? AppColors.darkSubtle : Colors.grey[100],
                        contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                // Filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: Row(
                    children: [
                      FilterChip(
                        label: Text('همه (${ValidationUtils.toPersianDigits(_allAthletes.length)})'),
                        selected: _filterMode == 'all',
                        onSelected: (_) => setState(() => _filterMode = 'all'),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.circle, size: 8, color: AppColors.debt),
                            const SizedBox(width: 4),
                            Text(
                              'دارای بدهی (${ValidationUtils.toPersianDigits(_allAthletes.where((a) => a.hasDebt).length)})',
                            ),
                          ],
                        ),
                        selected: _filterMode == 'debt',
                        onSelected: (_) => setState(() => _filterMode = 'debt'),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.circle, size: 8, color: AppColors.paid),
                            const SizedBox(width: 4),
                            Text(
                              'تسویه کامل (${ValidationUtils.toPersianDigits(_allAthletes.where((a) => !a.hasDebt).length)})',
                            ),
                          ],
                        ),
                        selected: _filterMode == 'paid',
                        onSelected: (_) => setState(() => _filterMode = 'paid'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        body: Stack(
          children: [
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'ورزشکاری با این مشخصات یافت نشد'
                                  : 'هنوز ورزشکاری ثبت نشده است',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadAthletes,
                        child: ListView.separated(
                          controller: _scrollController,
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => Divider(
                            height: 1,
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                          itemBuilder: (ctx, idx) {
                            final athlete = filtered[idx];
                            return _buildAthleteRow(athlete, isDark);
                          },
                        ),
                      ),

            // Draggable Alphabet Quick Index on side with >=36px tap targets
            Positioned(
              top: 16,
              bottom: 16,
              left: 0,
              child: AlphabetQuickIndex(
                letters: letters,
                onLetterSelected: _scrollToLetter,
              ),
            ),

            // Celebratory Confetti Widget
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
          tooltip: 'ثبت ورزشکار جدید',
          child: const Icon(Icons.add, size: 28),
        ),
      ),
    );
  }

  Widget _buildAthleteRow(Athlete athlete, bool isDark) {
    final heroTag = 'avatar-${athlete.id}';

    return Dismissible(
      key: Key(athlete.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (dir) async {
        _confirmDelete(athlete);
        return false;
      },
      background: Container(
        color: AppColors.debt,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
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
              // Hero-animated Avatar
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
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        // Consistent Status Dot on EVERY row
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

              // Trailing registration date
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSubtle : Colors.grey[200],
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      athlete.trainingCategory.split(' ')[0],
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                    ),
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
