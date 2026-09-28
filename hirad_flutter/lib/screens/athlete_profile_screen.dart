import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/athlete.dart';
import '../data/athlete_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/avatar.dart';
import '../widgets/status_badge.dart';
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

  void _changePhoto() async {
    if (_athlete == null) return;
    final updated = _athlete!.copyWith(
      photoPath: _athlete!.photoPath == null
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          : null,
      lastUpdated: DateTime.now(),
    );
    await _repository.updateAthlete(updated);
    setState(() => _athlete = updated);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('عکس پروفایل به‌روزرسانی شد'),
          behavior: SnackBarBehavior.floating,
        ),
      );
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
              child: const Text('انصراف'),
              onPressed: () => Navigator.pop(context),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.debt,
                foregroundColor: Colors.white,
              ),
              child: const Text('حذف قطعی'),
              onPressed: () async {
                await _repository.deleteAthlete(_athlete!.id);
                if (mounted) {
                  Navigator.pop(context); // close dialog
                  Navigator.pop(context, true); // return to list with deleted status
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddPaymentDialog() {
    final amountController = TextEditingController();
    final dateController = TextEditingController(text: JalaliUtils.getTodayJalali().formatted);
    final titleController = TextEditingController(text: 'واریز شهریه باشگاه');
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text('ثبت واریزی جدید', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  labelText: 'مبلغ پرداختی (تومان) *',
                  hintText: 'مثلاً ۱,۵۰۰,۰۰۰',
                  suffixText: 'تومان',
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) {
                  final f = ValidationUtils.formatNumberInput(v);
                  if (f != v) {
                    amountController.value = TextEditingValue(
                      text: f,
                      selection: TextSelection.collapsed(offset: f.length),
                    );
                  }
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: dateController,
                keyboardType: TextInputType.datetime,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  labelText: 'تاریخ پرداخت (شمسی) *',
                  hintText: 'مثلاً ۱۴۰۵/۰۶/۲۵',
                  prefixIcon: Icon(Icons.calendar_today, size: 18),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'شیوه پرداخت / عنوان',
                  hintText: 'کارت به کارت، پوز باشگاه و ...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteController,
                decoration: const InputDecoration(
                  labelText: 'یادداشت اختیاری',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              child: const Text('انصراف'),
              onPressed: () => Navigator.pop(ctx),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.paid,
                foregroundColor: Colors.white,
              ),
              child: const Text('ثبت واریزی'),
              onPressed: () async {
                final amount = ValidationUtils.parseNumberInput(amountController.text);
                if (amount <= 0) return;

                final today = JalaliUtils.getTodayJalali();
                final payDate = dateController.text.trim().isNotEmpty
                    ? ValidationUtils.toEnglishDigits(dateController.text.trim())
                    : today.formatted;

                final record = PaymentRecord(
                  id: 'pay-${DateTime.now().millisecondsSinceEpoch}',
                  date: payDate,
                  amount: amount,
                  type: 'payment',
                  title: titleController.text.trim().isNotEmpty ? titleController.text.trim() : 'واریز شهریه',
                  note: noteController.text.trim().isNotEmpty ? noteController.text.trim() : null,
                );

                final newPaid = (_athlete!.tuitionPaid) + amount;
                final curUnpaid = _athlete!.tuitionUnpaid ?? 0;
                final newUnpaid = curUnpaid > amount ? curUnpaid - amount : 0;

                final updated = _athlete!.copyWith(
                  tuitionPaid: newPaid,
                  tuitionUnpaid: newUnpaid,
                  payments: [record, ..._athlete!.payments],
                  lastUpdated: DateTime.now(),
                );

                await _repository.updateAthlete(updated);
                setState(() => _athlete = updated);
                if (mounted) Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddChargeDialog() {
    final amountController = TextEditingController(
      text: ValidationUtils.formatCurrencyToman(_athlete?.monthlyFee ?? 2000000, includeUnit: false),
    );
    final titleController = TextEditingController(text: 'شهریه دوره جدید');

    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text('ثبت شهریه ماه جدید', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  labelText: 'مبلغ شهریه دوره جدید *',
                  suffixText: 'تومان',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'عنوان دوره',
                  hintText: 'شهریه آبان ماه و ...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              child: const Text('انصراف'),
              onPressed: () => Navigator.pop(ctx),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand500,
                foregroundColor: Colors.white,
              ),
              child: const Text('افزودن به بدهی'),
              onPressed: () async {
                final amount = ValidationUtils.parseNumberInput(amountController.text);
                if (amount <= 0) return;

                final today = JalaliUtils.getTodayJalali();
                final record = PaymentRecord(
                  id: 'chg-${DateTime.now().millisecondsSinceEpoch}',
                  date: today.formatted,
                  amount: amount,
                  type: 'charge',
                  title: titleController.text.trim(),
                );

                final newUnpaid = (_athlete!.tuitionUnpaid ?? 0) + amount;

                final updated = _athlete!.copyWith(
                  monthlyFee: amount,
                  tuitionUnpaid: newUnpaid,
                  payments: [record, ..._athlete!.payments],
                  lastUpdated: DateTime.now(),
                );

                await _repository.updateAthlete(updated);
                setState(() => _athlete = updated);
                if (mounted) Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _deleteTransaction(String id) async {
    if (_athlete == null) return;
    final tx = _athlete!.payments.firstWhere((p) => p.id == id);
    int newPaid = _athlete!.tuitionPaid;
    int newUnpaid = _athlete!.tuitionUnpaid ?? 0;

    if (tx.type == 'payment') {
      newPaid = newPaid > tx.amount ? newPaid - tx.amount : 0;
      newUnpaid = newUnpaid + tx.amount;
    } else {
      newUnpaid = newUnpaid > tx.amount ? newUnpaid - tx.amount : 0;
    }

    final updated = _athlete!.copyWith(
      tuitionPaid: newPaid,
      tuitionUnpaid: newUnpaid,
      payments: _athlete!.payments.where((p) => p.id != id).toList(),
      lastUpdated: DateTime.now(),
    );

    await _repository.updateAthlete(updated);
    setState(() => _athlete = updated);
  }

  void _addTodayAttendance() async {
    if (_athlete == null) return;
    final today = JalaliUtils.getTodayJalali();
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final nextSession = _athlete!.attendances.length + 1;
    final record = AttendanceRecord(
      id: 'att-${DateTime.now().millisecondsSinceEpoch}',
      date: today.formatted,
      time: timeStr,
      sessionNumber: nextSession,
    );

    final updated = _athlete!.copyWith(
      attendances: [record, ..._athlete!.attendances],
      lastUpdated: DateTime.now(),
    );

    await _repository.updateAthlete(updated);
    setState(() => _athlete = updated);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('جلسه شماره $nextSession با موفقیت ثبت شد ✅'),
          backgroundColor: AppColors.paid,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _deleteAttendance(String id) async {
    if (_athlete == null) return;
    final updated = _athlete!.copyWith(
      attendances: _athlete!.attendances.where((a) => a.id != id).toList(),
      lastUpdated: DateTime.now(),
    );
    await _repository.updateAthlete(updated);
    setState(() => _athlete = updated);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_athlete == null) {
      return const Scaffold(
        body: Center(child: Text('ورزشکار یافت نشد')),
      );
    }

    final athlete = _athlete!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final age = JalaliUtils.calculateAge(athlete.birthDateJalali);
    final duration = JalaliUtils.calculateMembershipDuration(athlete.registrationDateJalali);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward_ios, size: 20),
            onPressed: () => Navigator.pop(context),
            tooltip: 'بازگشت به لیست',
          ),
          title: const Text('پرونده ورزشکار', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.edit, color: AppColors.brand500),
              onPressed: _editAthlete,
              tooltip: 'ویرایش پرونده',
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.debt),
              onPressed: _confirmDelete,
              tooltip: 'حذف پرونده',
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar with camera icon
              Stack(
                children: [
                  AthleteAvatar(
                    firstName: athlete.firstName,
                    lastName: athlete.lastName,
                    photoPath: athlete.photoPath,
                    size: AvatarSize.xl,
                    heroTag: 'avatar-${athlete.id}',
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: InkWell(
                      onTap: _changePhoto,
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.brand500,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark ? AppColors.darkBg : Colors.white,
                            width: 2,
                          ),
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Full Name
              Hero(
                tag: 'name-${athlete.id}',
                child: Material(
                  color: Colors.transparent,
                  child: Text(
                    athlete.fullName,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Badges: Age, Category, Debt Status
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (age.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkBorder : Colors.grey[200],
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
              const SizedBox(height: 18),

              // Action Buttons: Call / SMS / WhatsApp
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.paid,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
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
              const SizedBox(height: 18),

              // Section 1: Financial & Tuition Card with Ledger
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.monetization_on, color: AppColors.brand500, size: 20),
                            SizedBox(width: 8),
                            Text('وضعیت مالی و شهریه', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Row(
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.paid,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                visualDensity: VisualDensity.compact,
                              ),
                              icon: const Icon(Icons.add, size: 14),
                              label: const Text('واریزی', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              onPressed: _showAddPaymentDialog,
                            ),
                            const SizedBox(width: 6),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brand500,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                visualDensity: VisualDensity.compact,
                              ),
                              icon: const Icon(Icons.add, size: 14),
                              label: const Text('دوره جدید', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              onPressed: _showAddChargeDialog,
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Divider(height: 20),

                    // 3 Financial indicators
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkSubtle : Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                const Text('شهریه ماه:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                                const SizedBox(height: 2),
                                Text(
                                  ValidationUtils.formatCurrencyToman(athlete.monthlyFee),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.paid.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                const Text('پرداختی:', style: TextStyle(fontSize: 10, color: AppColors.paid)),
                                const SizedBox(height: 2),
                                Text(
                                  ValidationUtils.formatCurrencyToman(athlete.tuitionPaid),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.paid),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: athlete.hasDebt ? AppColors.debt.withOpacity(0.1) : Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                Text('مانده بدهی:', style: TextStyle(fontSize: 10, color: athlete.hasDebt ? AppColors.debt : Colors.grey)),
                                const SizedBox(height: 2),
                                Text(
                                  athlete.hasDebt
                                      ? ValidationUtils.formatCurrencyToman(athlete.tuitionUnpaid)
                                      : 'تسویه',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: athlete.hasDebt ? AppColors.debt : Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Payments ledger
                    const Text('ریز سوابق پرداخت و تراکنش‌ها:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    if (athlete.payments.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Center(
                          child: Text('هنوز تراکنشی ثبت نشده است', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: athlete.payments.length,
                        separatorBuilder: (_, __) => const Divider(height: 8),
                        itemBuilder: (ctx, i) {
                          final p = athlete.payments[i];
                          final isPay = p.type == 'payment';
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkSubtle.withOpacity(0.5) : Colors.grey[50],
                              borderRadius: BorderRadius.circular(AppRadius.md),
                              border: Border.all(
                                color: isDark ? AppColors.darkBorder.withOpacity(0.5) : Colors.grey[200]!,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            p.title,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: (isPay ? AppColors.paid : AppColors.debt).withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(AppRadius.sm),
                                              border: Border.all(
                                                color: (isPay ? AppColors.paid : AppColors.debt).withOpacity(0.3),
                                              ),
                                            ),
                                            child: Text(
                                              isPay ? 'پرداخت‌شده' : 'ثبت بدهی',
                                              style: TextStyle(
                                                color: isPay ? AppColors.paid : AppColors.debt,
                                                fontSize: 9,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'تاریخ پرداخت: ${ValidationUtils.toPersianDigits(p.date)}${p.note != null ? ' • ${p.note}' : ''}',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        const Text('مبلغ پرداختی:', style: TextStyle(fontSize: 9, color: Colors.grey)),
                                        Text(
                                          '${isPay ? '+' : '-'}${ValidationUtils.formatCurrencyToman(p.amount)}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w900,
                                            color: isPay ? AppColors.paid : AppColors.debt,
                                          ),
                                        ),
                                      ],
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                                      onPressed: () => _deleteTransaction(p.id),
                                      tooltip: 'حذف این تراکنش',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Section 2: Attendance Sessions Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.how_to_reg, color: AppColors.paid, size: 20),
                            SizedBox(width: 8),
                            Text('سوابق و جلسات حضور', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.paid,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            visualDensity: VisualDensity.compact,
                          ),
                          icon: const Icon(Icons.check, size: 14),
                          label: const Text('ثبت ورود امروز', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          onPressed: _addTodayAttendance,
                        ),
                      ],
                    ),
                    const Divider(height: 16),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.paid.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'تعداد کل جلسات: ${ValidationUtils.toPersianDigits(athlete.attendances.length)} جلسه',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.paid),
                          ),
                          if (athlete.attendances.isNotEmpty)
                            Text(
                              'آخرین: ${athlete.attendances.first.date}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    if (athlete.attendances.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Center(
                          child: Text('هنوز هیچ جلسه‌ای ثبت نشده است', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: athlete.attendances.length,
                        separatorBuilder: (_, __) => const Divider(height: 6),
                        itemBuilder: (ctx, i) {
                          final a = athlete.attendances[i];
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.paid.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'جلسه ${ValidationUtils.toPersianDigits(a.sessionNumber)}',
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.paid),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${JalaliUtils.formatJalaliPretty(a.date)} (ساعت ${a.time})',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 16, color: Colors.grey),
                                onPressed: () => _deleteAttendance(a.id),
                              ),
                            ],
                          );
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Section 3: Contact & National ID Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.badge_outlined, color: AppColors.brand500, size: 18),
                        SizedBox(width: 8),
                        Text('اطلاعات تماس و هویتی', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(height: 20),
                    _buildInfoRow('شماره موبایل', athlete.mobileNumber, Icons.phone_android, () => _copyToClipboard(athlete.mobileNumber, 'شماره موبایل')),
                    const SizedBox(height: 12),
                    _buildInfoRow('کد ملی (ثبت احوال)', athlete.nationalCode, Icons.credit_card, () => _copyToClipboard(athlete.nationalCode, 'کد ملی')),
                    const SizedBox(height: 12),
                    _buildInfoRow('تاریخ تولد', JalaliUtils.formatJalaliPretty(athlete.birthDateJalali), Icons.cake, null),
                    const SizedBox(height: 12),
                    _buildInfoRow('تاریخ عضویت', '${JalaliUtils.formatJalaliPretty(athlete.registrationDateJalali)} ($duration)', Icons.calendar_today, null),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Notes Card
              if (athlete.notes != null && athlete.notes!.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.notes, color: AppColors.brand500, size: 18),
                          SizedBox(width: 8),
                          Text('یادداشت مربی', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(athlete.notes!, style: const TextStyle(fontSize: 12, height: 1.6)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon, VoidCallback? onCopy) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Colors.grey),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        Row(
          children: [
            Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            if (onCopy != null) ...[
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.copy, size: 14, color: Colors.grey),
                onPressed: onCopy,
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
