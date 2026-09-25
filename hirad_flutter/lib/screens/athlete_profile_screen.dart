import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/athlete.dart';
import '../data/athlete_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/avatar.dart';
import '../widgets/status_badge.dart';
import '../widgets/financial_card.dart';
import '../utils/validation.dart';
import '../utils/jalali.dart';
import 'registration_form_screen.dart';

class AthleteProfileScreen extends StatefulWidget {
  final String athleteId;

  const AthleteProfileScreen({super.key, required this.athleteId});

  @override
  State<AthleteProfileScreen> createState() => _AthleteProfileScreenState();
}

class _AthleteProfileScreenState extends State<AthleteProfileScreen> {
  final AthleteRepository _repository = AthleteRepository();
  Athlete? _athlete;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAthlete();
  }

  Future<void> _loadAthlete() async {
    final list = await _repository.getAthletes();
    final found = list.firstWhere(
      (a) => a.id == widget.athleteId,
      orElse: () => list.first,
    );
    setState(() {
      _athlete = found;
      _isLoading = false;
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label در کلیپ‌بورد کپی شد'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _launchUrlScheme(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _editAthlete() async {
    if (_athlete == null) return;
    final updated = await showModalBottomSheet<Athlete>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RegistrationFormScreen(editAthlete: _athlete),
    );

    if (updated != null) {
      await _repository.updateAthlete(updated);
      setState(() => _athlete = updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('پرونده ورزشکار با موفقیت ویرایش شد'),
            backgroundColor: AppColors.paid,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _confirmDelete() {
    if (_athlete == null) return;
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text('حذف ورزشکار', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text(
            'آیا از حذف پرونده ${_athlete!.fullName} اطمینان دارید؟ تمام سوابق ایشان پاک خواهد شد.',
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
                await _repository.deleteAthlete(_athlete!.id);
                if (mounted) {
                  Navigator.pop(context, true); // Pop back to list with refresh signal
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
    if (_isLoading || _athlete == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final athlete = _athlete!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final heroTag = 'avatar-${athlete.id}';
    final age = JalaliUtils.calculateAge(athlete.birthDateJalali);
    final membershipDuration = JalaliUtils.calculateMembershipDuration(athlete.registrationDateJalali);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('پرونده ورزشکار', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: AppColors.brand500),
              tooltip: 'ویرایش پرونده',
              onPressed: _editAthlete,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.debt),
              tooltip: 'حذف',
              onPressed: _confirmDelete,
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            children: [
              // Hero Avatar & Name Header
              Center(
                child: AthleteAvatar(
                  firstName: athlete.firstName,
                  lastName: athlete.lastName,
                  photoPath: athlete.photoPath,
                  size: AvatarSize.xl,
                  heroTag: heroTag,
                  hasDebt: athlete.hasDebt,
                  showStatusBadge: true,
                ),
              ),
              const SizedBox(height: 14),

              Text(
                athlete.fullName,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),

              // Badges: Age, Training Category, Payment Status
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (age.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSubtle : Colors.grey[200],
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Text(
                        age,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  TrainingCategoryBadge(category: athlete.trainingCategory),
                  PaymentStatusBadge(
                    hasDebt: athlete.hasDebt,
                    tuitionUnpaid: athlete.tuitionUnpaid,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Action Buttons: Call / SMS / WhatsApp
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.paid,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                      icon: const Icon(Icons.phone, size: 18),
                      label: const Text('تماس', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () => _launchUrlScheme('tel:${athlete.mobileNumber}'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                      icon: const Icon(Icons.message, size: 18),
                      label: const Text('پیامک', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () => _launchUrlScheme('sms:${athlete.mobileNumber}'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                      icon: const Icon(Icons.chat_bubble_outline, size: 18),
                      label: const Text('واتساپ', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () {
                        final clean = athlete.mobileNumber.replaceFirst(RegExp(r'^0'), '');
                        _launchUrlScheme('https://wa.me/98$clean');
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Financial Status Card
              FinancialCard(
                tuitionPaid: athlete.tuitionPaid,
                tuitionUnpaid: athlete.tuitionUnpaid,
              ),
              const SizedBox(height: 14),

              // Contact & Identification Card: Label-above-value layout!
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.badge_outlined, color: AppColors.brand500, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'اطلاعات تماس و هویتی',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.grey[300] : Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    const SizedBox(height: 12),

                    // Mobile Row: Label on top, Value below
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'شماره موبایل:',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.grey[400] : Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ValidationUtils.toPersianDigits(athlete.mobileNumber),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          tooltip: 'کپی شماره',
                          onPressed: () => _copyToClipboard(athlete.mobileNumber, 'شماره موبایل'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    const SizedBox(height: 10),

                    // National Code Row: Label on top, Value below, Verified badge NEXT to digits
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'کد ملی:',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.grey[400] : Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  ValidationUtils.toPersianDigits(athlete.nationalCode),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.paid.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(AppRadius.sm),
                                    border: Border.all(color: AppColors.paid.withOpacity(0.3)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.verified, size: 12, color: AppColors.paid),
                                      SizedBox(width: 4),
                                      Text(
                                        'تایید ثبت احوال',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.paid,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, size: 18),
                          tooltip: 'کپی کد ملی',
                          onPressed: () => _copyToClipboard(athlete.nationalCode, 'کد ملی'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Dates & Records Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.calendar_month_outlined, color: AppColors.brand500, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'تاریخ‌ها و سوابق عضویت',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.grey[300] : Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    const SizedBox(height: 12),

                    // Birth date
                    Row(
                      children: [
                        const Icon(Icons.cake_outlined, size: 18, color: Colors.grey),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'تاریخ تولد (شمسی):',
                              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${JalaliUtils.formatJalaliPretty(athlete.birthDateJalali)} ($age)',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    const SizedBox(height: 10),

                    // Registration date
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 18, color: Colors.grey),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'تاریخ شروع عضویت در هیراد:',
                              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              JalaliUtils.formatJalaliPretty(athlete.registrationDateJalali),
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            if (membershipDuration.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                membershipDuration,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brand600,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Notes Card
              if (athlete.notes != null && athlete.notes!.isNotEmpty) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.notes, color: AppColors.brand500, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'یادداشت‌های تمرینی و پزشکی',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.grey[300] : Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        athlete.notes!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.grey[300] : Colors.grey[800],
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Bottom Full-Width Edit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? Colors.white : Colors.black,
                    foregroundColor: isDark ? Colors.black : Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                  ),
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text(
                    'ویرایش کامل پرونده ورزشکار',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  onPressed: _editAthlete,
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
