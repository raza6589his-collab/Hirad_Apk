import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Edit3,
  Trash2,
  Phone,
  MessageSquare,
  CreditCard,
  Calendar,
  Coins,
  ShieldCheck,
  Clock,
  UserCheck,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Send,
  Dumbbell,
  Camera,
  PlusCircle,
  History,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';
import { Athlete, PaymentRecord, AttendanceRecord } from '../types/athlete';
import { Avatar } from './Avatar';
import {
  formatCurrencyToman,
  formatSignedCurrencyToman,
  formatNumberInput,
  parseNumberInput,
} from '../utils/currency';
import {
  formatJalaliPretty,
  calculateAge,
  calculateMembershipDuration,
  toPersianDigits,
  getTodayJalali,
  toEnglishDigits,
} from '../utils/jalali';
import { JalaliDatePicker } from './JalaliDatePicker';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface AthleteProfileProps {
  athlete: Athlete;
  onBack: () => void;
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  onUpdate: (athlete: Athlete) => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({
  athlete,
  onBack,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [showAddAttendanceModal, setShowAddAttendanceModal] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState<'payment' | 'attendance' | null>(null);

  // New Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodChip, setPaymentMethodChip] = useState<string>('کارت‌به‌کارت');
  const [paymentTitle, setPaymentTitle] = useState('کارت‌به‌کارت');
  const [paymentDate, setPaymentDate] = useState(() => getTodayJalali().formatted);
  const [paymentNote, setPaymentNote] = useState('');

  // New Charge Form States
  const [chargeAmount, setChargeAmount] = useState(
    formatNumberInput(String(athlete.monthlyFee || 2000000))
  );
  const [chargeTitle, setChargeTitle] = useState('شهریه دوره جدید');

  // Manual Attendance Form States
  const today = getTodayJalali();
  const [attDate, setAttDate] = useState(today.formatted);
  const [attTime, setAttTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const photoInputRef = useRef<HTMLInputElement>(null);

  const hasDebt = !!(athlete.tuitionUnpaid && athlete.tuitionUnpaid > 0);
  const age = calculateAge(athlete.birthDate);
  const membershipDuration = calculateMembershipDuration(athlete.registrationDate);

  const attendances = athlete.attendances || [];
  const payments = athlete.payments || [];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Upload or change avatar photo directly from mobile/system
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

          const updated: Athlete = {
            ...athlete,
            photo: compressed,
            lastUpdated: new Date().toISOString(),
          };
          onUpdate(updated);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new payment record
  const handleSavePayment = () => {
    const amountNum = parseNumberInput(paymentAmount);
    if (!amountNum || amountNum <= 0) return;

    const normalizedDate = toEnglishDigits(paymentDate).trim() || today.formatted;

    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      date: normalizedDate,
      amount: amountNum,
      type: 'payment',
      title: paymentTitle.trim() || 'واریزی شهریه',
      note: paymentNote.trim() || undefined,
    };

    const newPaid = (athlete.tuitionPaid || 0) + amountNum;
    const currentUnpaid = athlete.tuitionUnpaid || 0;
    const newUnpaid = Math.max(0, currentUnpaid - amountNum);

    const updated: Athlete = {
      ...athlete,
      tuitionPaid: newPaid,
      tuitionUnpaid: newUnpaid,
      payments: [newPayment, ...(athlete.payments || [])],
      lastUpdated: new Date().toISOString(),
    };

    onUpdate(updated);
    setPaymentAmount('');
    setPaymentTitle('واریزی شهریه');
    setPaymentNote('');
    setPaymentDate(today.formatted);
    setShowAddPaymentModal(false);
  };

  // Add new monthly charge record
  const handleSaveCharge = () => {
    const amountNum = parseNumberInput(chargeAmount);
    if (!amountNum || amountNum <= 0) return;

    const newCharge: PaymentRecord = {
      id: 'chg-' + Date.now(),
      date: today.formatted,
      amount: amountNum,
      type: 'charge',
      title: chargeTitle.trim() || 'شهریه دوره جدید',
    };

    const newUnpaid = (athlete.tuitionUnpaid || 0) + amountNum;

    const updated: Athlete = {
      ...athlete,
      monthlyFee: amountNum,
      tuitionUnpaid: newUnpaid,
      payments: [newCharge, ...(athlete.payments || [])],
      lastUpdated: new Date().toISOString(),
    };

    onUpdate(updated);
    setShowAddChargeModal(false);
  };

  // Confirm and delete transaction
  const confirmDeleteTransaction = () => {
    if (!transactionToDelete) return;
    const tx = payments.find((p) => p.id === transactionToDelete);
    if (!tx) return;

    let newPaid = athlete.tuitionPaid || 0;
    let newUnpaid = athlete.tuitionUnpaid || 0;

    if (tx.type === 'payment') {
      newPaid = Math.max(0, newPaid - tx.amount);
      newUnpaid = newUnpaid + tx.amount;
    } else {
      newUnpaid = Math.max(0, newUnpaid - tx.amount);
    }

    const updated: Athlete = {
      ...athlete,
      tuitionPaid: newPaid,
      tuitionUnpaid: newUnpaid,
      payments: payments.filter((p) => p.id !== transactionToDelete),
      lastUpdated: new Date().toISOString(),
    };

    onUpdate(updated);
    setTransactionToDelete(null);
  };

  // Add attendance session
  const handleAddAttendance = (date: string, time: string) => {
    const nextSession = attendances.length + 1;
    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      date,
      time,
      sessionNumber: nextSession,
    };

    const updated: Athlete = {
      ...athlete,
      attendances: [record, ...attendances],
      lastUpdated: new Date().toISOString(),
    };

    onUpdate(updated);
    setShowAddAttendanceModal(false);
  };

  // Delete attendance session
  const handleDeleteAttendance = (attId: string) => {
    const updated: Athlete = {
      ...athlete,
      attendances: attendances.filter((a) => a.id !== attId),
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-white select-none overflow-y-auto">
      {/* Top Bar with Standardized 40x40 Action Buttons */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-darkCard/95 border-b border-slate-200/80 dark:border-darkBorder backdrop-blur-md px-4 py-3 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkBorder active:scale-95 transition-all"
          aria-label="بازگشت به لیست"
          title="بازگشت به لیست ورزشکاران"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          پرونده ورزشکار
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(athlete)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 active:scale-95 transition-all"
            title="ویرایش پرونده"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
            title="حذف پرونده"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Profile Body */}
      <div className="flex-1 pb-16">
        {/* Profile Header Hero Section */}
        <div className="px-6 pt-6 pb-6 flex flex-col items-center text-center">
          {/* Avatar with Camera upload button */}
          <div className="relative mb-3 group">
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Avatar
              firstName={athlete.firstName}
              lastName={athlete.lastName}
              photo={athlete.photo}
              size="xl"
              layoutId={`avatar-${athlete.id}`}
              status={hasDebt ? 'unpaid' : 'paid'}
              showStatusBadge={true}
            />
            {/* Upload Button Overlay */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-md flex items-center justify-center ring-2 ring-white dark:ring-darkBg active:scale-90 transition-all"
              title="تغییر یا آپلود عکس پروفایل"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <motion.h2
            layoutId={`name-${athlete.id}`}
            className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            {athlete.firstName} {athlete.lastName}
          </motion.h2>

          {/* Badges Bar: Age, Training Category, Payment Status */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {age.text && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-darkBorder text-slate-700 dark:text-slate-300">
                {age.text}
              </span>
            )}

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              {athlete.trainingCategory}
            </span>

            {hasDebt ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                بدهی: {formatCurrencyToman(athlete.tuitionUnpaid)}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                تسویه کامل
              </span>
            )}
          </div>

          {/* Quick Action Buttons (Call / SMS / WhatsApp) */}
          <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-xs">
            <a
              href={`tel:${athlete.mobileNumber}`}
              className="flex-1 h-11 px-3 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              تماس
            </a>
            <a
              href={`sms:${athlete.mobileNumber}`}
              className="flex-1 h-11 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              پیامک
            </a>
            <a
              href={`https://wa.me/98${athlete.mobileNumber.replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              واتساپ
            </a>
          </div>
        </div>

        {/* Staggered Animated Info Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4 space-y-4 max-w-xl mx-auto"
        >
          {/* Section 1: Financial Status Card with Payment Breakdown & Ledger */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm space-y-4"
          >
            <div className="pb-3 border-b border-slate-100 dark:border-darkBorder/60 space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  وضعیت مالی و شهریه
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(true)}
                  className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  ثبت واریزی جدید
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddChargeModal(true)}
                  className="h-11 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  شهریه ماه جدید
                </button>
              </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-darkSubtle/50 border border-slate-100 dark:border-darkBorder/50">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">شهریه ماه جاری:</span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {formatCurrencyToman(athlete.monthlyFee || (athlete.tuitionPaid + (athlete.tuitionUnpaid || 0)))}
                </p>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">کل پرداخت‌شده:</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyToman(athlete.tuitionPaid)}
                </p>
              </div>

              <div className={`p-2.5 rounded-2xl border ${
                hasDebt
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                <span className="text-[10px] font-bold block mb-1">
                  {hasDebt ? 'مانده بدهی:' : 'وضعیت حساب:'}
                </span>
                <p className="text-xs font-black">
                  {hasDebt ? formatCurrencyToman(athlete.tuitionUnpaid) : 'بدون بدهی (تسویه)'}
                </p>
              </div>
            </div>

            {/* Payment & Transaction History List */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  سوابق و ریز تراکنش‌های مالی ({toPersianDigits(payments.length)} رکورد)
                </span>
              </div>

              {payments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50 dark:bg-darkSubtle/30 rounded-xl">
                  هنوز هیچ پرداخت مجزایی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {payments.map((p) => {
                    const isPayment = p.type === 'payment';
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-darkSubtle/50 border border-slate-100 dark:border-darkBorder/60 flex items-center justify-between text-xs transition-all hover:bg-slate-100/70 dark:hover:bg-darkSubtle"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {p.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isPayment
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              {isPayment ? 'پرداخت‌شده' : 'ثبت بدهی دوره'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            <span>تاریخ: <strong className="text-slate-700 dark:text-slate-300"><bdi dir="ltr">{toPersianDigits(p.date)}</bdi></strong></span>
                            {p.note && <span className="mr-1.5">• {p.note}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">مبلغ:</span>
                            <span
                              className={`text-xs font-black ${
                                isPayment
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500'
                              }`}
                            >
                              <bdi dir="ltr">{isPayment ? '+' : '-'}&nbsp;{formatCurrencyToman(p.amount, false)}&nbsp;تومان</bdi>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTransactionToDelete(p.id)}
                            className="w-11 h-11 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                            title="حذف این تراکنش"
                            aria-label="حذف این تراکنش"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 2: Attendance & Session History Card */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-darkBorder/60">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                  سوابق و جلسات حضور
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    handleAddAttendance(today.formatted, timeStr);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ثبت ورود امروز
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAttendanceModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-darkBorder text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  دستی
                </button>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  تعداد کل جلسات ثبت‌شده:
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {toPersianDigits(attendances.length)} جلسه حضور
                </p>
              </div>
              {attendances.length > 0 && (
                <div className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>آخرین حضور:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {attendances[0].date} ({attendances[0].time})
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Sessions List */}
            {attendances.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 dark:bg-darkSubtle/30 rounded-xl">
                هنوز هیچ جلسه حضوری برای این ورزشکار ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {attendances.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-darkSubtle/50 border border-slate-100 dark:border-darkBorder/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[11px] flex items-center justify-center">
                        {toPersianDigits(att.sessionNumber)}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          جلسه {toPersianDigits(att.sessionNumber)} • {formatJalaliPretty(att.date)}
                        </span>
                        <span className="text-[10px] text-slate-400">ساعت {att.time}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAttendance(att.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="حذف این جلسه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Section 3: Identity & Contact Card */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
              <CreditCard className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                اطلاعات هویتی و تماس
              </h3>
            </div>

            {/* National ID */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">کد ملی:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                  <bdi dir="ltr">{toPersianDigits(athlete.nationalId)}</bdi>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  معتبر
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(athlete.nationalId, 'nationalId')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-darkBorder transition-colors"
                title="کپی کد ملی"
              >
                {copiedField === 'nationalId' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Mobile Number */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-darkBorder/40">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">موبایل:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                  <bdi dir="ltr">{toPersianDigits(athlete.mobileNumber)}</bdi>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(athlete.mobileNumber, 'mobileNumber')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-darkBorder transition-colors"
                title="کپی شماره موبایل"
              >
                {copiedField === 'mobileNumber' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Section 4: Membership Dates */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
              <Calendar className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                تاریخ‌ها و سوابق عضویت
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400">تاریخ تولد:</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {formatJalaliPretty(athlete.birthDate)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400">تاریخ شروع عضویت:</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {formatJalaliPretty(athlete.registrationDate)}
                </p>
                {membershipDuration && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-500/20">
                    {membershipDuration}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Section 5: Coach Notes */}
          {athlete.notes && (
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
                <FileText className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                  یادداشت مربی
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-3 whitespace-pre-line">
                {athlete.notes}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Mini Modal: Add Payment */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPaymentModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-darkBorder z-10 space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-darkBorder">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  ثبت واریزی و پرداخت جدید
                </h3>
                <button onClick={() => setShowAddPaymentModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ پرداختی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    autoFocus
                    value={toPersianDigits(paymentAmount)}
                    onChange={(e) => setPaymentAmount(formatNumberInput(e.target.value))}
                    placeholder="۱,۵۰۰,۰۰۰"
                    className="w-full text-right pr-3.5 pl-14 py-2.5 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-sm outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                    تومان
                  </span>
                </div>
                {paymentAmount && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    معادل: {formatCurrencyToman(parseNumberInput(paymentAmount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ پرداخت (شمسی) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveDatePicker('payment')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-emerald-500 transition-colors"
                >
                  <span>{formatJalaliPretty(paymentDate)} (<bdi dir="ltr">{toPersianDigits(paymentDate)}</bdi>)</span>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شیوه پرداخت
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {(['کارت‌به‌کارت', 'پوز باشگاه', 'نقدی', 'سایر'] as const).map((method) => {
                    const isSelected = paymentMethodChip === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethodChip(method);
                          if (method !== 'سایر') {
                            setPaymentTitle(method);
                          } else if (['کارت‌به‌کارت', 'پوز باشگاه', 'نقدی'].includes(paymentTitle)) {
                            setPaymentTitle('');
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                            : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>

                {paymentMethodChip === 'سایر' && (
                  <input
                    type="text"
                    value={paymentTitle}
                    onChange={(e) => setPaymentTitle(e.target.value)}
                    placeholder="عنوان دلخواه پرداخت (مثلاً انتقال شبا، پاداش و ...)"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-xs outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت اختیاری
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="توضیحات و شماره پیگیری"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-darkBorder text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-600/25"
                >
                  تایید و ذخیره واریزی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini Modal: Add New Monthly Charge */}
      <AnimatePresence>
        {showAddChargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddChargeModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-darkBorder z-10 space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-darkBorder">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-brand-500" />
                  ثبت تمدید و شهریه دوره جدید
                </h3>
                <button onClick={() => setShowAddChargeModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ شهریه دوره جدید <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    autoFocus
                    value={toPersianDigits(chargeAmount)}
                    onChange={(e) => setChargeAmount(formatNumberInput(e.target.value))}
                    placeholder="۲,۰۰۰,۰۰۰"
                    className="w-full text-right pr-3.5 pl-14 py-2.5 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="text-[11px] font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                    تومان
                  </span>
                </div>
                {chargeAmount && (
                  <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400 mt-1">
                    معادل: {formatCurrencyToman(parseNumberInput(chargeAmount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان دوره
                </label>
                <input
                  type="text"
                  value={chargeTitle}
                  onChange={(e) => setChargeTitle(e.target.value)}
                  placeholder="شهریه آبان ماه و ..."
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChargeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-darkBorder text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveCharge}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-black text-white shadow-md shadow-brand-500/25"
                >
                  افزودن به بدهی دوره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini Modal: Add Manual Attendance */}
      <AnimatePresence>
        {showAddAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAttendanceModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-darkBorder z-10 space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-darkBorder">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  ثبت دستی جلسه حضور
                </h3>
                <button onClick={() => setShowAddAttendanceModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ شمسی جلسه *
                </label>
                <button
                  type="button"
                  onClick={() => setActiveDatePicker('attendance')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-emerald-500 transition-colors"
                >
                  <span>{formatJalaliPretty(attDate)} (<bdi dir="ltr">{toPersianDigits(attDate)}</bdi>)</span>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ساعت حضور (مثلاً ۱۸:۳۰)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={toPersianDigits(attTime)}
                  onChange={(e) => setAttTime(toEnglishDigits(e.target.value))}
                  className="w-full text-right pr-3.5 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAttendanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-darkBorder text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAttendance(attDate, attTime)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md"
                >
                  ثبت این جلسه
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Transaction Confirmation Dialog */}
      <AnimatePresence>
        {transactionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTransactionToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-6 shadow-2xl border border-rose-500/20 z-10 text-center space-y-4"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف تراکنش مالی
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  آیا از حذف این رکورد مالی اطمینان دارید؟ مبالغ به صورت خودکار محاسبه و به‌روزرسانی خواهند شد.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransactionToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-darkBorder text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTransaction}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-colors"
                >
                  حذف تراکنش
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Athlete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-6 shadow-2xl border border-rose-500/20 z-10 text-center space-y-4"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف پرونده ورزشکار
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  آیا از حذف پرونده «{athlete.firstName} {athlete.lastName}» و تمامی سوابق مالی و جلسات او اطمینان دارید؟ این عمل قابل بازگشت نیست.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-darkBorder text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(athlete);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-colors"
                >
                  حذف قطعی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jalali Date Pickers for Payment & Attendance */}
      <JalaliDatePicker
        isOpen={activeDatePicker === 'payment'}
        value={paymentDate}
        title="انتخاب تاریخ پرداخت"
        minYear={1395}
        maxYear={today.year + 1}
        onChange={(d) => setPaymentDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />

      <JalaliDatePicker
        isOpen={activeDatePicker === 'attendance'}
        value={attDate}
        title="انتخاب تاریخ جلسه حضور"
        minYear={1395}
        maxYear={today.year + 1}
        onChange={(d) => setAttDate(d)}
        onClose={() => setActiveDatePicker(null)}
      />
    </div>
  );
};
