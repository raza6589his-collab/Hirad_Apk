import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Calendar as CalendarIcon,
  CreditCard,
  Phone,
  User,
  AlertCircle,
  Coins,
  Dumbbell,
  Trash2,
  Edit2,
  Calculator,
} from 'lucide-react';
import { Athlete, TrainingCategory, TRAINING_CATEGORIES } from '../types/athlete';
import {
  validateNationalId,
  validateMobileNumber,
  validateName,
  formatNumberInput,
  parseNumberInput,
  formatCurrencyToman,
} from '../utils/validation';
import {
  getTodayJalali,
  formatJalaliPretty,
  toEnglishDigits,
  toPersianDigits,
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
  const today = getTodayJalali();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [mobileNumber, setMobileNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [directBirthInput, setDirectBirthInput] = useState(false);
  const [registrationDate, setRegistrationDate] = useState(today.formatted);
  const [trainingCategory, setTrainingCategory] = useState<TrainingCategory>('بدنسازی عمومی');
  const [monthlyFee, setMonthlyFee] = useState('2,000,000');
  const [tuitionPaid, setTuitionPaid] = useState('2,000,000');
  const [tuitionUnpaid, setTuitionUnpaid] = useState('0');
  const [autoCalculateUnpaid, setAutoCalculateUnpaid] = useState(true);
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
      if (editAthlete && editAthlete.id) {
        setFirstName(editAthlete.firstName);
        setLastName(editAthlete.lastName);
        setPhoto(editAthlete.photo);
        setMobileNumber(editAthlete.mobileNumber);
        setNationalId(editAthlete.nationalId);
        setBirthDate(editAthlete.birthDate || '');
        setRegistrationDate(editAthlete.registrationDate);
        setTrainingCategory(editAthlete.trainingCategory || 'بدنسازی عمومی');
        const mFee = editAthlete.monthlyFee || (editAthlete.tuitionPaid || 0) + (editAthlete.tuitionUnpaid || 0) || 2000000;
        setMonthlyFee(formatNumberInput(String(mFee)));
        setTuitionPaid(formatNumberInput(String(editAthlete.tuitionPaid || '')));
        setTuitionUnpaid(
          typeof editAthlete.tuitionUnpaid === 'number'
            ? formatNumberInput(String(editAthlete.tuitionUnpaid))
            : '0'
        );
        setAutoCalculateUnpaid(false);
        setNotes(editAthlete.notes || '');
      } else {
        // Reset form for new athlete - starts with empty birthDate (with optional prefilled nationalId)
        setFirstName('');
        setLastName('');
        setPhoto(undefined);
        setMobileNumber('');
        setNationalId(editAthlete?.nationalId || '');
        setBirthDate('');
        setRegistrationDate(today.formatted);
        setTrainingCategory('بدنسازی عمومی');
        setMonthlyFee('2,000,000');
        setTuitionPaid('2,000,000');
        setTuitionUnpaid('0');
        setAutoCalculateUnpaid(true);
        setNotes('');
      }
      setDirectBirthInput(false);
      setTouched({});
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, editAthlete]);

  // Recalculate remaining tuition when monthlyFee or tuitionPaid changes
  const handleFeeChange = (newFee: string) => {
    const formatted = formatNumberInput(newFee);
    setMonthlyFee(formatted);
    if (autoCalculateUnpaid) {
      const feeNum = parseNumberInput(formatted);
      const paidNum = parseNumberInput(tuitionPaid);
      const remaining = Math.max(0, feeNum - paidNum);
      setTuitionUnpaid(formatNumberInput(String(remaining)));
    }
  };

  const handlePaidChange = (newPaid: string) => {
    const formatted = formatNumberInput(newPaid);
    setTuitionPaid(formatted);
    if (autoCalculateUnpaid) {
      const feeNum = parseNumberInput(monthlyFee);
      const paidNum = parseNumberInput(formatted);
      const remaining = Math.max(0, feeNum - paidNum);
      setTuitionUnpaid(formatNumberInput(String(remaining)));
    }
  };

  // Validation function
  const runValidation = (field: string, value: string) => {
    let err = '';
    if (field === 'firstName') {
      const v = validateName(value, 'نام');
      if (!v.isValid) err = v.error || '';
    } else if (field === 'lastName') {
      const v = validateName(value, 'نام خانوادگی');
      if (!v.isValid) err = v.error || '';
    } else if (field === 'birthDate') {
      if (!value || !value.trim()) {
        err = 'انتخاب تاریخ تولد الزامی است';
      }
    } else if (field === 'mobileNumber') {
      const v = validateMobileNumber(value);
      if (!v.isValid) err = v.error || '';
    } else if (field === 'nationalId') {
      const v = validateNationalId(value);
      if (!v.isValid) err = v.error || '';
    } else if (field === 'monthlyFee') {
      const num = parseNumberInput(value);
      if (!value.trim() || isNaN(num) || num <= 0) {
        err = 'مبلغ شهریه دوره الزامی است';
      }
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runValidation(field, value);
  };

  // Auto-scroll on focus so mobile keyboard doesn't obscure input
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم عکس انتخابی نباید بیش از ۵ مگابایت باشد');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress / downscale image to max 400x400 for optimal local storage
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhoto(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      birthDate: true,
      mobileNumber: true,
      nationalId: true,
      monthlyFee: true,
    });

    const isFnValid = runValidation('firstName', firstName);
    const isLnValid = runValidation('lastName', lastName);
    const isBirthValid = runValidation('birthDate', birthDate);
    const isMobValid = runValidation('mobileNumber', mobileNumber);
    const isNatValid = runValidation('nationalId', nationalId);
    const isFeeValid = runValidation('monthlyFee', monthlyFee);

    if (!isFnValid || !isLnValid || !isBirthValid || !isMobValid || !isNatValid || !isFeeValid) {
      const fieldList = [
        { key: 'firstName', valid: isFnValid },
        { key: 'lastName', valid: isLnValid },
        { key: 'birthDate', valid: isBirthValid },
        { key: 'mobileNumber', valid: isMobValid },
        { key: 'nationalId', valid: isNatValid },
        { key: 'monthlyFee', valid: isFeeValid },
      ];
      const firstInvalid = fieldList.find((f) => !f.valid);
      if (firstInvalid) {
        const el = document.getElementById(`field-${firstInvalid.key}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedMonthly = parseNumberInput(monthlyFee);
      const parsedPaid = parseNumberInput(tuitionPaid) || 0;
      const parsedUnpaid = tuitionUnpaid ? parseNumberInput(tuitionUnpaid) : 0;

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
          monthlyFee: parsedMonthly,
          tuitionPaid: parsedPaid,
          tuitionUnpaid: parsedUnpaid,
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

              {/* Form Content - Scrollable with Extra Bottom Padding for Keyboard */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-48">
                {/* Photo Upload from device */}
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
                        : 'border-dashed border-brand-400/80 dark:border-brand-500/50 bg-brand-50/50 dark:bg-brand-950/20'
                    }`}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt="پیش‌نمایش عکس"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-brand-600 dark:text-brand-400">
                        <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-bold mt-1">افزودن عکس</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    {photo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
                        >
                          تغییر عکس
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhoto(undefined)}
                          className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        تصویر چهره ورزشکار (اختیاری)
                      </span>
                    )}
                  </div>
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
                        id="field-firstName"
                        type="text"
                        value={firstName}
                        onFocus={handleInputFocus}
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
                        id="field-lastName"
                        type="text"
                        value={lastName}
                        onFocus={handleInputFocus}
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

                  {/* Date of Birth Picker with Rapid Year Jump & Direct Typing */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        تاریخ تولد <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setDirectBirthInput(!directBirthInput)}
                        className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        {directBirthInput ? 'انتخاب از تقویم' : 'تایپ مستقیم تاریخ'}
                      </button>
                    </div>

                    {directBirthInput ? (
                      <div className="relative">
                        <input
                          id="field-birthDate"
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          placeholder="۱۳۷۸/۰۵/۱۴"
                          value={toPersianDigits(birthDate)}
                          onFocus={handleInputFocus}
                          onChange={(e) => {
                            let val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                            if (val.length > 4 && val.charAt(4) !== '/') val = val.slice(0, 4) + '/' + val.slice(4);
                            if (val.length > 7 && val.charAt(7) !== '/') val = val.slice(0, 7) + '/' + val.slice(7, 9);
                            const finalVal = val.slice(0, 10);
                            setBirthDate(finalVal);
                            if (touched.birthDate) runValidation('birthDate', finalVal);
                          }}
                          onBlur={() => handleBlur('birthDate', birthDate)}
                          className={`w-full text-right pr-3.5 pl-10 py-2.5 text-sm tracking-wider rounded-xl bg-slate-50 dark:bg-darkSubtle border outline-none ${
                            touched.birthDate && errors.birthDate
                              ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200'
                              : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                          }`}
                        />
                        <CalendarIcon className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ) : (
                      <button
                        id="field-birthDate"
                        type="button"
                        onClick={() => setActiveDatePicker('birth')}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border flex items-center justify-between transition-colors ${
                          touched.birthDate && errors.birthDate
                            ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-200 hover:border-brand-500'
                        }`}
                      >
                        {birthDate ? (
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {formatJalaliPretty(birthDate)} (<bdi dir="ltr">{toPersianDigits(birthDate)}</bdi>)
                          </span>
                        ) : (
                          <span className="font-normal text-slate-400">
                            انتخاب تاریخ تولد (مثال: ۱۳۷۸/۰۵/۱۴)
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-xs font-bold">
                          <span>انتخاب سال و ماه</span>
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                      </button>
                    )}
                    <AnimatePresence>
                      {touched.birthDate && errors.birthDate && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.birthDate}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Section 2: Contact & Identification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <Phone className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      اطلاعات تماس و هویت
                    </span>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      شماره موبایل <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="field-mobileNumber"
                        type="tel"
                        dir="ltr"
                        maxLength={11}
                        value={toPersianDigits(mobileNumber)}
                        onFocus={handleInputFocus}
                        onChange={(e) => {
                          const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                          setMobileNumber(val);
                          if (touched.mobileNumber) runValidation('mobileNumber', val);
                        }}
                        onBlur={() => handleBlur('mobileNumber', mobileNumber)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className={`w-full text-right pr-3.5 pl-10 py-2.5 text-sm tracking-wider rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.mobileNumber && errors.mobileNumber
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد ملی <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="field-nationalId"
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={10}
                        value={toPersianDigits(nationalId)}
                        onFocus={handleInputFocus}
                        onChange={(e) => {
                          const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                          setNationalId(val);
                          if (touched.nationalId) runValidation('nationalId', val);
                        }}
                        onBlur={() => handleBlur('nationalId', nationalId)}
                        placeholder="۰۰۱۲۳۴۵۶۷۹"
                        className={`w-full text-right pr-3.5 pl-10 py-2.5 text-sm tracking-wider rounded-xl bg-slate-50 dark:bg-darkSubtle border transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          touched.nationalId && errors.nationalId
                            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500'
                        }`}
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      ۱۰ رقم، بدون خط تیره (شناسه اختصاصی ثبت حضور)
                    </p>
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
                  </div>
                </div>

                {/* Section 4: Enhanced Financial Structure with Auto-Calculation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-darkBorder/40">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ساختار شهریه و امور مالی
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoCalculateUnpaid(!autoCalculateUnpaid)}
                      className="text-[11px] font-bold flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <Calculator className="w-3 h-3" />
                      {autoCalculateUnpaid ? 'محاسبه خودکار بدهی: فعال' : 'محاسبه دستی'}
                    </button>
                  </div>

                  {/* Monthly Fee */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      مبلغ شهریه ماه جاری (نرخ مصوب این ماه) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="field-monthlyFee"
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={toPersianDigits(monthlyFee)}
                        onFocus={handleInputFocus}
                        onChange={(e) => handleFeeChange(e.target.value)}
                        onBlur={() => handleBlur('monthlyFee', monthlyFee)}
                        placeholder="۲,۰۰۰,۰۰۰"
                        className="w-full text-right pr-3.5 pl-14 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                      />
                      <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                        تومان
                      </span>
                    </div>
                    {monthlyFee && (
                      <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-1">
                        معادل: {formatCurrencyToman(parseNumberInput(monthlyFee))}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-start">
                    {/* Tuition Paid */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        شهریه پرداخت شده
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={toPersianDigits(tuitionPaid)}
                          onFocus={handleInputFocus}
                          onChange={(e) => handlePaidChange(e.target.value)}
                          placeholder="۲,۰۰۰,۰۰۰"
                          className="w-full text-right pr-3.5 pl-14 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                        />
                        <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                          تومان
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {tuitionPaid ? formatCurrencyToman(parseNumberInput(tuitionPaid)) : '۰ تومان'}
                      </p>
                    </div>

                    {/* Tuition Unpaid (Auto-calculated) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          باقی‌مانده / بدهی
                        </label>
                        {autoCalculateUnpaid && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                            خودکار
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          value={toPersianDigits(tuitionUnpaid)}
                          onFocus={handleInputFocus}
                          onChange={(e) => {
                            setAutoCalculateUnpaid(false);
                            setTuitionUnpaid(formatNumberInput(e.target.value));
                          }}
                          placeholder="۰"
                          className="w-full text-right pr-3.5 pl-14 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors"
                        />
                        <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                          تومان
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {tuitionUnpaid ? formatCurrencyToman(parseNumberInput(tuitionUnpaid)) : '۰ تومان'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    یادداشت مربی یا وضعیت جسمانی (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onFocus={handleInputFocus}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="سوابق آسیب‌دیدگی، اهداف، ساعات تمرین و ..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors resize-none"
                  />
                </div>
              </form>

              {/* Sticky Submit Button at Bottom */}
              <div className="p-4 border-t border-slate-100 dark:border-darkBorder/60 bg-white/90 dark:bg-darkCard/90 backdrop-blur-md sticky bottom-0 z-20">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editAthlete ? 'ذخیره تغییرات پرونده' : 'ثبت ورزشکار در باشگاه هیراد'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date Pickers */}
      <JalaliDatePicker
        isOpen={activeDatePicker === 'birth'}
        value={birthDate || '1378/01/01'}
        title="انتخاب تاریخ تولد"
        minYear={1330}
        maxYear={today.year}
        onChange={(d) => {
          setBirthDate(d);
          setErrors((prev) => ({ ...prev, birthDate: '' }));
        }}
        onClose={() => setActiveDatePicker(null)}
      />

      <JalaliDatePicker
        isOpen={activeDatePicker === 'registration'}
        value={registrationDate}
        title="انتخاب تاریخ شروع عضویت"
        minYear={1395}
        maxYear={today.year + 2}
        onChange={(d) => setRegistrationDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />
    </>
  );
};
