import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/athlete.dart';
import '../theme/app_theme.dart';
import '../widgets/jalali_date_picker_dialog.dart';
import '../utils/validation.dart';
import '../utils/jalali.dart';

class RegistrationFormScreen extends StatefulWidget {
  final Athlete? editAthlete;

  const RegistrationFormScreen({super.key, this.editAthlete});

  @override
  State<RegistrationFormScreen> createState() => _RegistrationFormScreenState();
}

class _RegistrationFormScreenState extends State<RegistrationFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _mobileController;
  late final TextEditingController _nationalCodeController;
  late final TextEditingController _monthlyFeeController;
  late final TextEditingController _tuitionPaidController;
  late final TextEditingController _tuitionUnpaidController;
  late final TextEditingController _birthDateController;
  late final TextEditingController _notesController;

  late String _birthDate;
  late String _registrationDate;
  late String _trainingCategory;
  String? _photoPath;
  bool _directBirthInput = false;
  bool _autoCalculateDebt = true;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final edit = widget.editAthlete;
    final today = JalaliUtils.getTodayJalali();

    _firstNameController = TextEditingController(text: edit?.firstName ?? '');
    _lastNameController = TextEditingController(text: edit?.lastName ?? '');
    _mobileController = TextEditingController(text: edit?.mobileNumber ?? '');
    _nationalCodeController = TextEditingController(text: edit?.nationalCode ?? '');

    final mFee = edit?.monthlyFee ?? 2000000;
    final tPaid = edit?.tuitionPaid ?? 2000000;
    final tUnpaid = edit?.tuitionUnpaid ?? 0;

    _monthlyFeeController = TextEditingController(
      text: ValidationUtils.formatCurrencyToman(mFee, includeUnit: false),
    );
    _tuitionPaidController = TextEditingController(
      text: ValidationUtils.formatCurrencyToman(tPaid, includeUnit: false),
    );
    _tuitionUnpaidController = TextEditingController(
      text: tUnpaid > 0
          ? ValidationUtils.formatCurrencyToman(tUnpaid, includeUnit: false)
          : '0',
    );

    _birthDate = edit?.birthDateJalali ?? '1375/01/01';
    _birthDateController = TextEditingController(text: _birthDate);
    _registrationDate = edit?.registrationDateJalali ?? today.formatted;
    _trainingCategory = edit?.trainingCategory ?? 'بدنسازی عمومی';
    _photoPath = edit?.photoPath;
    _notesController = TextEditingController(text: edit?.notes ?? '');
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _mobileController.dispose();
    _nationalCodeController.dispose();
    _monthlyFeeController.dispose();
    _tuitionPaidController.dispose();
    _tuitionUnpaidController.dispose();
    _birthDateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onFeeChanged(String val) {
    if (_autoCalculateDebt) {
      final fee = ValidationUtils.parseNumberInput(_monthlyFeeController.text);
      final paid = ValidationUtils.parseNumberInput(_tuitionPaidController.text);
      final rem = fee > paid ? fee - paid : 0;
      _tuitionUnpaidController.text =
          ValidationUtils.formatCurrencyToman(rem, includeUnit: false);
    }
  }

  void _onPaidChanged(String val) {
    if (_autoCalculateDebt) {
      final fee = ValidationUtils.parseNumberInput(_monthlyFeeController.text);
      final paid = ValidationUtils.parseNumberInput(_tuitionPaidController.text);
      final rem = fee > paid ? fee - paid : 0;
      _tuitionUnpaidController.text =
          ValidationUtils.formatCurrencyToman(rem, includeUnit: false);
    }
  }

  void _pickBirthDate() async {
    final picked = await showDialog<String>(
      context: context,
      builder: (ctx) => JalaliDatePickerDialog(
        initialDate: _birthDate,
        title: 'انتخاب تاریخ تولد',
        minYear: 1330,
        maxYear: 1405,
      ),
    );
    if (picked != null) {
      setState(() {
        _birthDate = picked;
        _birthDateController.text = picked;
      });
    }
  }

  void _pickRegistrationDate() async {
    final picked = await showDialog<String>(
      context: context,
      builder: (ctx) => JalaliDatePickerDialog(
        initialDate: _registrationDate,
        title: 'انتخاب تاریخ عضویت در باشگاه',
        minYear: 1395,
        maxYear: 1415,
      ),
    );
    if (picked != null) {
      setState(() => _registrationDate = picked);
    }
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 350));

    final cleanMobile = ValidationUtils.toEnglishDigits(_mobileController.text.trim());
    final cleanNat = ValidationUtils.toEnglishDigits(_nationalCodeController.text.trim());
    final mFee = ValidationUtils.parseNumberInput(_monthlyFeeController.text);
    final paid = ValidationUtils.parseNumberInput(_tuitionPaidController.text);
    final unpaid = _tuitionUnpaidController.text.trim().isNotEmpty
        ? ValidationUtils.parseNumberInput(_tuitionUnpaidController.text)
        : 0;

    final birth = _directBirthInput
        ? ValidationUtils.toEnglishDigits(_birthDateController.text.trim())
        : _birthDate;

    final athlete = Athlete(
      id: widget.editAthlete?.id ?? const Uuid().v4(),
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      photoPath: _photoPath,
      mobileNumber: cleanMobile,
      nationalCode: cleanNat,
      birthDateJalali: birth,
      registrationDateJalali: _registrationDate,
      trainingCategory: _trainingCategory,
      monthlyFee: mFee,
      tuitionPaid: paid,
      tuitionUnpaid: unpaid,
      payments: widget.editAthlete?.payments ??
          (paid > 0
              ? [
                  PaymentRecord(
                    id: 'pay-${DateTime.now().millisecondsSinceEpoch}',
                    date: _registrationDate,
                    amount: paid,
                    type: 'payment',
                    title: 'پرداخت اولیه هنگام ثبت‌نام',
                  )
                ]
              : []),
      attendances: widget.editAthlete?.attendances ?? [],
      lastUpdated: DateTime.now(),
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (mounted) {
      Navigator.pop(context, athlete);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEditing = widget.editAthlete != null;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.94,
        ),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        ),
        child: Column(
          children: [
            // Top Drag Handle & Title
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[400],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppColors.brand500,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isEditing ? 'ویرایش پرونده ورزشکار' : 'ثبت ورزشکار جدید',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Scrollable Form Body with dynamic bottom padding so keyboard doesn't cover tuition
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(16, 16, 16, bottomInset + 100),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Photo Upload Avatar
                      Center(
                        child: InkWell(
                          onTap: () {
                            // Toggle sample photo or custom avatar
                            setState(() {
                              _photoPath = _photoPath == null
                                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                                  : null;
                            });
                          },
                          borderRadius: BorderRadius.circular(50),
                          child: Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _photoPath != null
                                  ? Colors.transparent
                                  : (isDark ? AppColors.darkSubtle : AppColors.brand50),
                              border: Border.all(
                                color: AppColors.brand500,
                                width: 2,
                              ),
                            ),
                            child: _photoPath != null
                                ? ClipOval(
                                    child: Image.network(
                                      _photoPath!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 40),
                                    ),
                                  )
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: const [
                                      Icon(Icons.camera_alt, color: AppColors.brand500, size: 28),
                                      SizedBox(height: 4),
                                      Text(
                                        'انتخاب عکس',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.brand500,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Section 1: Personal Info
                      _buildSectionHeader(Icons.person, 'مشخصات فردی'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _firstNameController,
                              scrollPadding: const EdgeInsets.only(bottom: 120),
                              decoration: const InputDecoration(
                                labelText: 'نام *',
                                hintText: 'مثال: علی',
                                border: OutlineInputBorder(),
                              ),
                              validator: (v) {
                                final res = ValidationUtils.validateName(v ?? '', 'نام');
                                return res.isValid ? null : res.error;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _lastNameController,
                              scrollPadding: const EdgeInsets.only(bottom: 120),
                              decoration: const InputDecoration(
                                labelText: 'نام خانوادگی *',
                                hintText: 'مثال: محمدی',
                                border: OutlineInputBorder(),
                              ),
                              validator: (v) {
                                final res = ValidationUtils.validateName(v ?? '', 'نام خانوادگی');
                                return res.isValid ? null : res.error;
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Date of Birth with Fast Selection & Direct Typing
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'تاریخ تولد (شمسی) *',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          TextButton.icon(
                            icon: Icon(
                              _directBirthInput ? Icons.calendar_month : Icons.edit,
                              size: 14,
                            ),
                            label: Text(
                              _directBirthInput ? 'انتخاب از تقویم' : 'تایپ مستقیم تاریخ',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            onPressed: () {
                              setState(() {
                                _directBirthInput = !_directBirthInput;
                              });
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (_directBirthInput)
                        TextFormField(
                          controller: _birthDateController,
                          keyboardType: TextInputType.number,
                          textDirection: TextDirection.ltr,
                          scrollPadding: const EdgeInsets.only(bottom: 120),
                          decoration: const InputDecoration(
                            hintText: '1378/05/14',
                            prefixIcon: Icon(Icons.calendar_today, size: 18),
                            border: OutlineInputBorder(),
                          ),
                        )
                      else
                        InkWell(
                          onTap: _pickBirthDate,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              border: OutlineInputBorder(),
                              suffixIcon: Icon(Icons.calendar_today, color: AppColors.brand500),
                            ),
                            child: Text(
                              JalaliUtils.formatJalaliPretty(_birthDate),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ),
                      const SizedBox(height: 20),

                      // Section 2: Contact & Identification
                      _buildSectionHeader(Icons.contact_phone, 'اطلاعات تماس و هویت'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _mobileController,
                        keyboardType: TextInputType.phone,
                        textDirection: TextDirection.ltr,
                        scrollPadding: const EdgeInsets.only(bottom: 120),
                        decoration: const InputDecoration(
                          labelText: 'شماره موبایل *',
                          hintText: '09123456789',
                          prefixIcon: Icon(Icons.phone_android),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final res = ValidationUtils.validateMobileNumber(v ?? '');
                          return res.isValid ? null : res.error;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _nationalCodeController,
                        keyboardType: TextInputType.number,
                        textDirection: TextDirection.ltr,
                        scrollPadding: const EdgeInsets.only(bottom: 120),
                        decoration: const InputDecoration(
                          labelText: 'کد ملی (۱۰ رقم با اعتبارسنجی ثبت احوال) *',
                          hintText: '0012345679',
                          prefixIcon: Icon(Icons.credit_card),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final res = ValidationUtils.validateNationalId(v ?? '');
                          return res.isValid ? null : res.error;
                        },
                      ),
                      const SizedBox(height: 20),

                      // Section 3: Training Category & Dates
                      _buildSectionHeader(Icons.fitness_center, 'رشته و دوره عضویت'),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _trainingCategory,
                        decoration: const InputDecoration(
                          labelText: 'رشته و برنامه تمرینی *',
                          border: OutlineInputBorder(),
                        ),
                        items: Athlete.trainingCategories.map((cat) {
                          return DropdownMenuItem(value: cat, child: Text(cat));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _trainingCategory = val);
                        },
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: _pickRegistrationDate,
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'تاریخ شروع عضویت *',
                            border: OutlineInputBorder(),
                            suffixIcon: Icon(Icons.calendar_month, color: AppColors.brand500),
                          ),
                          child: Text(
                            JalaliUtils.formatJalaliPretty(_registrationDate),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Section 4: Enhanced Financial Structure with Auto-Calculation
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildSectionHeader(Icons.attach_money, 'شهریه و وضعیت مالی'),
                          TextButton.icon(
                            icon: const Icon(Icons.calculate, size: 14),
                            label: Text(
                              _autoCalculateDebt ? 'محاسبه خودکار بدهی' : 'دستی',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                            onPressed: () {
                              setState(() => _autoCalculateDebt = !_autoCalculateDebt);
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Monthly Fee
                      TextFormField(
                        controller: _monthlyFeeController,
                        keyboardType: TextInputType.number,
                        textDirection: TextDirection.ltr,
                        scrollPadding: const EdgeInsets.only(bottom: 140),
                        decoration: const InputDecoration(
                          labelText: 'مبلغ کل شهریه ماه جاری (تومان) *',
                          hintText: '۲,۰۰۰,۰۰۰',
                          suffixText: 'تومان',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (val) {
                          final f = ValidationUtils.formatNumberInput(val);
                          if (f != val) {
                            _monthlyFeeController.value = TextEditingValue(
                              text: f,
                              selection: TextSelection.collapsed(offset: f.length),
                            );
                          }
                          _onFeeChanged(val);
                          setState(() {});
                        },
                        validator: (v) {
                          final n = ValidationUtils.parseNumberInput(v ?? '');
                          if (n <= 0) return 'مبلغ شهریه الزامی است';
                          return null;
                        },
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'معادل: ${ValidationUtils.formatCurrencyToman(ValidationUtils.parseNumberInput(_monthlyFeeController.text))}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brand500),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _tuitionPaidController,
                              keyboardType: TextInputType.number,
                              textDirection: TextDirection.ltr,
                              scrollPadding: const EdgeInsets.only(bottom: 140),
                              decoration: const InputDecoration(
                                labelText: 'شهریه پرداختی *',
                                suffixText: 'تومان',
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (val) {
                                final f = ValidationUtils.formatNumberInput(val);
                                if (f != val) {
                                  _tuitionPaidController.value = TextEditingValue(
                                    text: f,
                                    selection: TextSelection.collapsed(offset: f.length),
                                  );
                                }
                                _onPaidChanged(val);
                                setState(() {});
                              },
                              validator: (v) {
                                final n = ValidationUtils.parseNumberInput(v ?? '');
                                if (n < 0) return 'مبلغ نامعتبر است';
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _tuitionUnpaidController,
                              keyboardType: TextInputType.number,
                              textDirection: TextDirection.ltr,
                              scrollPadding: const EdgeInsets.only(bottom: 140),
                              decoration: InputDecoration(
                                labelText: 'مانده بدهی',
                                suffixText: 'تومان',
                                helperText: _autoCalculateDebt ? 'محاسبه خودکار' : null,
                                border: const OutlineInputBorder(),
                              ),
                              onChanged: (val) {
                                setState(() => _autoCalculateDebt = false);
                                final f = ValidationUtils.formatNumberInput(val);
                                if (f != val) {
                                  _tuitionUnpaidController.value = TextEditingValue(
                                    text: f,
                                    selection: TextSelection.collapsed(offset: f.length),
                                  );
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Section 5: Notes
                      _buildSectionHeader(Icons.notes, 'یادداشت مربی (اختیاری)'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _notesController,
                        maxLines: 2,
                        scrollPadding: const EdgeInsets.only(bottom: 140),
                        decoration: const InputDecoration(
                          hintText: 'سوابق آسیب‌دیدگی، اهداف، ساعات تمرین...',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Sticky Bottom Submit Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                  ),
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.check),
                  label: Text(
                    isEditing ? 'ذخیره تغییرات پرونده' : 'ثبت ورزشکار در باشگاه هیراد',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  onPressed: _isSubmitting ? null : _submit,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.brand500),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
        ),
      ],
    );
  }
}
