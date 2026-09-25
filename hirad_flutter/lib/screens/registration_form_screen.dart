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
  late final TextEditingController _tuitionPaidController;
  late final TextEditingController _tuitionUnpaidController;
  late final TextEditingController _notesController;

  late String _birthDate;
  late String _registrationDate;
  late String _trainingCategory;
  String? _photoPath;

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
    _tuitionPaidController = TextEditingController(
      text: edit != null
          ? ValidationUtils.formatCurrencyToman(edit.tuitionPaid, includeUnit: false)
          : '۱,۵۰۰,۰۰۰',
    );
    _tuitionUnpaidController = TextEditingController(
      text: edit?.tuitionUnpaid != null && edit!.tuitionUnpaid! > 0
          ? ValidationUtils.formatCurrencyToman(edit.tuitionUnpaid, includeUnit: false)
          : '',
    );
    _notesController = TextEditingController(text: edit?.notes ?? '');

    _birthDate = edit?.birthDateJalali ?? '1375/01/01';
    _registrationDate = edit?.registrationDateJalali ?? today.formatted;
    _trainingCategory = edit?.trainingCategory ?? 'بدنسازی عمومی';
    _photoPath = edit?.photoPath;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _mobileController.dispose();
    _nationalCodeController.dispose();
    _tuitionPaidController.dispose();
    _tuitionUnpaidController.dispose();
    _notesController.dispose();
    super.dispose();
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
      setState(() => _birthDate = picked);
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
    final paid = ValidationUtils.parseNumberInput(_tuitionPaidController.text);
    final unpaid = _tuitionUnpaidController.text.trim().isNotEmpty
        ? ValidationUtils.parseNumberInput(_tuitionUnpaidController.text)
        : 0;

    final athlete = Athlete(
      id: widget.editAthlete?.id ?? const Uuid().v4(),
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      photoPath: _photoPath,
      mobileNumber: cleanMobile,
      nationalCode: cleanNat,
      birthDateJalali: _birthDate,
      registrationDateJalali: _registrationDate,
      trainingCategory: _trainingCategory,
      tuitionPaid: paid,
      tuitionUnpaid: unpaid,
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

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.92,
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
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[400],
                      borderRadius: BorderRadius.circular(AppRadius.full),
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
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
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

            // Form Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Section 1: Personal Info
                      _buildSectionHeader(Icons.person, 'مشخصات فردی'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _firstNameController,
                              decoration: const InputDecoration(
                                labelText: 'نام *',
                                border: OutlineInputBorder(),
                              ),
                              validator: (v) {
                                final res = ValidationUtils.validateName(v, 'نام');
                                return res.isValid ? null : res.error;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _lastNameController,
                              decoration: const InputDecoration(
                                labelText: 'نام خانوادگی *',
                                border: OutlineInputBorder(),
                              ),
                              validator: (v) {
                                final res = ValidationUtils.validateName(v, 'نام خانوادگی');
                                return res.isValid ? null : res.error;
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Birth Date Button
                      ListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          side: BorderSide(
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                        ),
                        leading: const Icon(Icons.cake, color: AppColors.brand500),
                        title: const Text('تاریخ تولد (شمسی) *', style: TextStyle(fontSize: 12)),
                        subtitle: Text(
                          JalaliUtils.formatJalaliPretty(_birthDate),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        trailing: const Icon(Icons.calendar_month, color: AppColors.brand500),
                        onTap: _pickBirthDate,
                      ),
                      const SizedBox(height: 20),

                      // Section 2: Contact & Identification
                      _buildSectionHeader(Icons.contact_phone, 'اطلاعات تماس و هویتی'),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _mobileController,
                        keyboardType: TextInputType.phone,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          labelText: 'شماره موبایل *',
                          hintText: '09123456789',
                          prefixIcon: Icon(Icons.phone),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final res = ValidationUtils.validateMobileNumber(v);
                          return res.isValid ? null : res.error;
                        },
                      ),
                      const SizedBox(height: 14),

                      TextFormField(
                        controller: _nationalCodeController,
                        keyboardType: TextInputType.number,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          labelText: 'کد ملی (۱۰ رقم با اعتبارسنجی ثبت‌احوال) *',
                          hintText: '0012345679',
                          prefixIcon: Icon(Icons.badge),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final res = ValidationUtils.validateNationalId(v);
                          return res.isValid ? null : res.error;
                        },
                      ),
                      const SizedBox(height: 20),

                      // Section 3: Training Category & Registration Date
                      _buildSectionHeader(Icons.fitness_center, 'دوره و عضویت در باشگاه'),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _trainingCategory,
                        decoration: const InputDecoration(
                          labelText: 'رشته و برنامه تمرینی *',
                          prefixIcon: Icon(Icons.sports_gymnastics),
                          border: OutlineInputBorder(),
                        ),
                        items: Athlete.trainingCategories.map((c) {
                          return DropdownMenuItem(value: c, child: Text(c));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _trainingCategory = val);
                        },
                      ),
                      const SizedBox(height: 14),

                      ListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          side: BorderSide(
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                        ),
                        leading: const Icon(Icons.access_time, color: AppColors.brand500),
                        title: const Text('تاریخ شروع عضویت *', style: TextStyle(fontSize: 12)),
                        subtitle: Text(
                          JalaliUtils.formatJalaliPretty(_registrationDate),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        trailing: const Icon(Icons.calendar_month, color: AppColors.brand500),
                        onTap: _pickRegistrationDate,
                      ),
                      const SizedBox(height: 20),

                      // Section 4: Financial Info
                      _buildSectionHeader(Icons.monetization_on, 'شهریه و وضعیت مالی'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _tuitionPaidController,
                              keyboardType: TextInputType.number,
                              textDirection: TextDirection.ltr,
                              decoration: const InputDecoration(
                                labelText: 'شهریه پرداختی (تومان) *',
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
                              },
                              validator: (v) {
                                final n = ValidationUtils.parseNumberInput(v ?? '');
                                if (n <= 0) return 'مبلغ الزامی است';
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
                              decoration: const InputDecoration(
                                labelText: 'باقی‌مانده / بدهی',
                                hintText: 'اختیاری',
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (val) {
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
                        decoration: const InputDecoration(
                          hintText: 'سوابق آسیب‌دیدگی، اهداف، روزهای تمرینی...',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 24),
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
        Icon(icon, color: AppColors.brand500, size: 16),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
        ),
      ],
    );
  }
}
