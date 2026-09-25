import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  User,
  Phone,
  CreditCard,
  Calendar as CalendarIcon,
  Coins,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Dumbbell,
} from 'lucide-react';
import { Athlete, TRAINING_CATEGORIES, TrainingCategory } from '../types/athlete';
import {
  validateNationalId,
  validateMobileNumber,
  validateName,
  formatNumberInput,
  parseNumberInput,
} from '../utils/validation';
import {
  getTodayJalali,
  formatJalaliPretty,
  toEnglishDigits,
} from '../utils/jalali';
import { JalaliDatePicker } from './JalaliDatePicker';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (athleteData: Omit<Athlete, 'id' | 'lastUpdated'>, id?: string) => Promise<void>;
  editAthlete?: Athlete | null;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAthlete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = getTodayJalali();

  // Form fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [mobileNumber, setMobileNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('1375/01/01');
  const [registrationDate, setRegistrationDate] = useState(today.formatted);
  const [trainingCategory, setTrainingCategory] = useState<TrainingCategory>('بدنسازی عمومی');
  const [tuitionPaid, setTuitionPaid] = useState('1,500,000');
  const [tuitionUnpaid, setTuitionUnpaid] = useState('');
  const [notes, setNotes] = useState('');

  // Field blur and validation states
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active DatePicker modal state
  const [activeDatePicker, setActiveDatePicker] = useState<'birth' | 'registration' | null>(null);

  // Initialize or populate form
  useEffect(() => {
    if (isOpen) {
      if (editAthlete) {
        setFirstName(editAthlete.firstName);
        setLastName(editAthlete.lastName);
        setPhoto(editAthlete.photo);
        setMobileNumber(editAthlete.mobileNumber);
        setNationalId(editAthlete.nationalId);
        setBirthDate(editAthlete.birthDate);
        setRegistrationDate(editAthlete.registrationDate);
        setTrainingCategory(editAthlete.trainingCategory || 'بدنسازی عمومی');
        setTuitionPaid(formatNumberInput(String(editAthlete.tuitionPaid || '')));
        setTuitionUnpaid(
          editAthlete.tuitionUnpaid ? formatNumberInput(String(editAthlete.tuitionUnpaid)) : ''
        );
        setNotes(editAthlete.notes || '');
      } else {
        // Reset form for new athlete
        setFirstName('');
        setLastName('');
        setPhoto(undefined);
        setMobileNumber('');
        setNationalId('');
        setBirthDate('1375/01/01');
        setRegistrationDate(today.formatted);
        setTrainingCategory('بدنسازی عمومی');
        setTuitionPaid('2,000,000');
        setTuitionUnpaid('');
        setNotes('');
      }
      setTouched({});
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, editAthlete]);

  // Validation function
  const runValidation = (field: string, value: string) => {
    let err = '';
    if (field === 'firstName') {
      const v = validateName(value, 'نام');
      if (!v.isValid) err = v.error || '';
    } else if (field === 'lastName') {
      const v = validateName(value, 'نام خانوادگی');
      if (!v.isValid) err = v.error || '';
    } else if (field === 'mobileNumber') {
      const v = validateMobileNumber(value);
      if (!v.isValid) err = v.error || '';
    } else if (field === 'nationalId') {
      const v = validateNationalId(value);
      if (!v.isValid) err = v.error || '';
    } else if (field === 'tuitionPaid') {
      const num = parseNumberInput(value);
      if (!value.trim() || isNaN(num) || num <= 0) {
        err = 'مبلغ پرداختی الزامی است';
      }
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runValidation(field, value);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم عکس انتخابی نباید بیش از ۵ مگابایت باشد');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form validity check
  const isFormValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    validateMobileNumber(mobileNumber).isValid &&
    validateNationalId(nationalId).isValid &&
    parseNumberInput(tuitionPaid) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      mobileNumber: true,
      nationalId: true,
      tuitionPaid: true,
    });

    const isFnValid = runValidation('firstName', firstName);
    const isLnValid = runValidation('lastName', lastName);
    const isMobValid = runValidation('mobileNumber', mobileNumber);
    const isNatValid = runValidation('nationalId', nationalId);
    const isTuiValid = runValidation('tuitionPaid', tuitionPaid);

    if (!isFnValid || !isLnValid || !isMobValid || !isNatValid || !isTuiValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          photo,
          mobileNumber: toEnglishDigits(mobileNumber.trim()),
          nationalId: toEnglishDigits(nationalId.trim()),
          birthDate,
          registrationDate,
          trainingCategory,
          tuitionPaid: parseNumberInput(tuitionPaid),
          tuitionUnpaid: tuitionUnpaid ? parseNumberInput(tuitionUnpaid) : 0,
          notes: notes.trim(),
        },
        editAthlete?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white dark:bg-darkCard rounded-t-[32px] shadow-2xl border-t border-slate-200 dark:border-darkBorder max-h-[92vh] flex flex-col z-10 overflow-hidden"
              dir="rtl"
            >
              {/* Sheet Drag Handle & Header */}
              <div className="pt-3 pb-2 px-6 border-b border-slate-100 dark:border-darkBorder/60 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md sticky top-0 z-20">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    {editAthlete ? 'ویرایش پرونده ورزشکار' : 'ثبت ورزشکار جدید'}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkBorder flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Content - Scrollable */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Photo Picker */}
                <div className="flex flex-col items-center justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-24 h-24 rounded-full cursor-pointer overflow-hidden border-2 transition-all flex items-center justify-center group ${
                      photo
                        ? 'border-brand-500 shadow-lg shadow-brand-500/20'
                        : 'border-dashed border-brand-400/80 dark:border-brand-500/50 bg-brand-50/50 dark:bg-brand-950/20 animate-pulse-subtle'
                    }`}
                  >
                    {photo ? (
                      <motion.img
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={photo}
                        alt="پیش‌نمایش عکس"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-brand-600 dark:text-brand-400">
                        <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold mt-1">افزودن عکس</span>
                      </div>
                    )}

                    {/* Camera overlay indicator */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(undefined)}
                      className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف عکس
                    </button>
                  )}
                </div>

                {/* Section 1: Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <User className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      مشخصات فردی
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        نام <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (touched.firstName) runValidation('firstName', e.target.value);
                        }}
                        onBlur={() => handleBlur('firstName', firstName)}
                        placeholder="مثال: علی"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.firstName && errors.firstName
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <AnimatePresence>
                        {touched.firstName && errors.firstName && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.firstName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        نام خانوادگی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (touched.lastName) runValidation('lastName', e.target.value);
                        }}
                        onBlur={() => handleBlur('lastName', lastName)}
                        placeholder="مثال: محمدی"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.lastName && errors.lastName
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <AnimatePresence>
                        {touched.lastName && errors.lastName && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.lastName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Date of Birth Picker Button */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تاریخ تولد (شمسی) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveDatePicker('birth')}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-brand-500 transition-colors"
                    >
                      <span className="font-semibold">{formatJalaliPretty(birthDate)}</span>
                      <CalendarIcon className="w-4 h-4 text-brand-500" />
                    </button>
                  </div>
                </div>

                {/* Section 2: Contact & Identification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <Phone className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      اطلاعات تماس و هویتی
                    </span>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      شماره موبایل <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={11}
                        value={mobileNumber}
                        onChange={(e) => {
                          const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                          setMobileNumber(val);
                          if (touched.mobileNumber) runValidation('mobileNumber', val);
                        }}
                        onBlur={() => handleBlur('mobileNumber', mobileNumber)}
                        placeholder="09123456789"
                        className={`w-full text-left pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.mobileNumber && errors.mobileNumber
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <AnimatePresence>
                      {touched.mobileNumber && errors.mobileNumber && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.mobileNumber}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* National ID Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        کد ملی (۱۰ رقم با اعتبارسنجی) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">الگوریتم ثبت احوال</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={10}
                        value={nationalId}
                        onChange={(e) => {
                          const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                          setNationalId(val);
                          if (touched.nationalId) runValidation('nationalId', val);
                        }}
                        onBlur={() => handleBlur('nationalId', nationalId)}
                        placeholder="0012345679"
                        className={`w-full text-left pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.nationalId && errors.nationalId
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <AnimatePresence>
                      {touched.nationalId && errors.nationalId && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.nationalId}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Section 3: Membership & Training Program */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <CalendarIcon className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      دوره و عضویت باشگاه
                    </span>
                  </div>

                  {/* Training Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-brand-500" />
                      رشته و برنامه تمرینی <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={trainingCategory}
                      onChange={(e) => setTrainingCategory(e.target.value as TrainingCategory)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                    >
                      {TRAINING_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تاریخ شروع عضویت <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveDatePicker('registration')}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-brand-500 transition-colors"
                    >
                      <span className="font-semibold">{formatJalaliPretty(registrationDate)}</span>
                      <CalendarIcon className="w-4 h-4 text-brand-500" />
                    </button>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      پیش‌فرض تاریخ امروز، اما در صورت ثبت گذشته‌نگر قابل تغییر است.
                    </p>
                  </div>
                </div>

                {/* Section 4: Financial */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <Coins className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      شهریه و وضعیت مالی
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Tuition Paid */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        شهریه پرداخت شده <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={tuitionPaid}
                          onChange={(e) => {
                            const formatted = formatNumberInput(e.target.value);
                            setTuitionPaid(formatted);
                            if (touched.tuitionPaid) runValidation('tuitionPaid', formatted);
                          }}
                          onBlur={() => handleBlur('tuitionPaid', tuitionPaid)}
                          placeholder="۱,۵۰۰,۰۰۰"
                          className={`w-full text-left pl-3.5 pr-14 py-2.5 text-sm font-mono rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                            touched.tuitionPaid && errors.tuitionPaid
                              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                              : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                          }`}
                        />
                        <span className="text-[11px] font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                          تومان
                        </span>
                      </div>
                      <AnimatePresence>
                        {touched.tuitionPaid && errors.tuitionPaid && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.tuitionPaid}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Tuition Unpaid (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          باقی‌مانده / بدهی
                        </label>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-darkBorder px-1.5 py-0.5 rounded">
                          اختیاری
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={tuitionUnpaid}
                          onChange={(e) => {
                            const formatted = formatNumberInput(e.target.value);
                            setTuitionUnpaid(formatted);
                          }}
                          placeholder="در صورت وجود بدهی"
                          className="w-full text-left pl-3.5 pr-14 py-2.5 text-sm font-mono rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                        />
                        <span className="text-[11px] font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Notes / Health Condition */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    یادداشت مربی یا وضعیت جسمانی (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: سابقه آسیب زانو، تمرکز روی چربی‌سوزی، روزهای زوج..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                  />
                </div>
              </form>

              {/* Sticky Submit Button Footer */}
              <div className="p-4 bg-white/95 dark:bg-darkCard/95 border-t border-slate-100 dark:border-darkBorder/60 backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isFormValid && !isSubmitting
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-brand-500/30 active:scale-[0.98]'
                      : 'bg-slate-200 dark:bg-darkBorder text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{editAthlete ? 'ذخیره تغییرات پرونده' : 'ثبت ورزشکار در باشگاه'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jalali Date Picker Modals */}
      <JalaliDatePicker
        isOpen={activeDatePicker === 'birth'}
        title="انتخاب تاریخ تولد"
        value={birthDate}
        minYear={1330}
        maxYear={1405}
        onChange={(d) => setBirthDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <JalaliDatePicker
        isOpen={activeDatePicker === 'registration'}
        title="انتخاب تاریخ عضویت در باشگاه"
        value={registrationDate}
        minYear={1395}
        maxYear={1415}
        onChange={(d) => setRegistrationDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />
    </>
  );
};
