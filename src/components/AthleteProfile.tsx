import React, { useState } from 'react';
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
} from 'lucide-react';
import { Athlete } from '../types/athlete';
import { Avatar } from './Avatar';
import { formatCurrencyToman } from '../utils/validation';
import {
  formatJalaliPretty,
  calculateAge,
  calculateMembershipDuration,
  toPersianDigits,
} from '../utils/jalali';

interface AthleteProfileProps {
  athlete: Athlete;
  onBack: () => void;
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({
  athlete,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasDebt = !!(athlete.tuitionUnpaid && athlete.tuitionUnpaid > 0);
  const age = calculateAge(athlete.birthDate);
  const membershipDuration = calculateMembershipDuration(athlete.registrationDate);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-white select-none">
      {/* Top Bar with Standardized 40x40 Action Buttons */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-darkCard/95 border-b border-slate-200/80 dark:border-darkBorder backdrop-blur-md px-4 py-3 shadow-sm flex items-center justify-between">
        {/* Back navigation button with proper back chevron */}
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

        {/* Action buttons (Edit & Delete) in standardized circular buttons */}
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all"
            title="حذف ورزشکار"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Profile Scroll View */}
      <div className="flex-1 overflow-y-auto pb-12">
        {/* Header Hero Banner with Clean Avatar (Photo or Persian Initials) */}
        <div className="relative bg-gradient-to-b from-brand-500/10 via-brand-500/5 to-transparent dark:from-brand-950/40 dark:via-brand-950/10 dark:to-transparent pt-8 pb-6 px-6 flex flex-col items-center text-center">
          {/* Shared Element Avatar with Clean Initials or Photo */}
          <div className="mb-4">
            <Avatar
              firstName={athlete.firstName}
              lastName={athlete.lastName}
              photo={athlete.photo}
              size="xl"
              layoutId={`avatar-${athlete.id}`}
              status={hasDebt ? 'unpaid' : 'paid'}
              showStatusBadge={true}
            />
          </div>

          {/* Shared Element Name */}
          <motion.h2
            layoutId={`name-${athlete.id}`}
            className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            {athlete.firstName} {athlete.lastName}
          </motion.h2>

          {/* Badges Bar: Age, Training Category (Option A), Payment Status */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {age.text && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-darkBorder text-slate-700 dark:text-slate-300">
                {age.text}
              </span>
            )}

            {/* Formal Training Category Badge (Option A) */}
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              {athlete.trainingCategory}
            </span>

            {/* Payment Status Badge */}
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
              className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              تماس
            </a>
            <a
              href={`sms:${athlete.mobileNumber}`}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              پیامک
            </a>
            <a
              href={`https://wa.me/98${athlete.mobileNumber.replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md shadow-green-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
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
          {/* Financial Status Card */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-darkBorder/60">
              <Coins className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                وضعیت مالی و شهریه
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400">شهریه پرداخت شده:</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrencyToman(athlete.tuitionPaid)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400">باقی‌مانده / بدهی:</span>
                {hasDebt ? (
                  <p className="text-sm font-black text-rose-500 mt-0.5">
                    {formatCurrencyToman(athlete.tuitionUnpaid)}
                  </p>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1">
                    <Check className="w-3 h-3" />
                    بدون بدهی
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact & Identification Card (Fixed National Code Layout) */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
              <UserCheck className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                اطلاعات تماس و هویتی
              </h3>
            </div>

            {/* Mobile Number Row: Label on top, Value below */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-darkSubtle flex items-center justify-center text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400">شماره موبایل:</span>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {toPersianDigits(athlete.mobileNumber)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(athlete.mobileNumber, 'mobile')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkBorder text-slate-400 hover:text-slate-600 transition-colors"
                title="کپی شماره"
              >
                {copiedField === 'mobile' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* National Code Row: Fixed Layout - Label on top ("کد ملی"), Value below, Badge NEXT to number */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-darkBorder/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-darkSubtle flex items-center justify-center text-slate-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400">کد ملی:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(athlete.nationalId)}
                    </p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      تایید ثبت احوال
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(athlete.nationalId, 'national')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkBorder text-slate-400 hover:text-slate-600 transition-colors"
                title="کپی کد ملی"
              >
                {copiedField === 'national' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Dates & Membership Duration Card */}
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
              <Calendar className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                تاریخ‌ها و سوابق عضویت
              </h3>
            </div>

            {/* Birth date */}
            <div className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-darkSubtle flex items-center justify-center text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">تاریخ تولد (شمسی):</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatJalaliPretty(athlete.birthDate)} {age.text && `(${age.text})`}
                </p>
              </div>
            </div>

            {/* Registration date */}
            <div className="flex items-center gap-3 py-1 border-t border-slate-100 dark:border-darkBorder/40">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-darkSubtle flex items-center justify-center text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400">تاریخ ثبت‌نام در هیراد:</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatJalaliPretty(athlete.registrationDate)}
                </p>
                {membershipDuration && (
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    {membershipDuration}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Coach Notes Card */}
          {athlete.notes && (
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-sm"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-darkBorder/60">
                <FileText className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                  یادداشت‌های تمرینی و پزشکی
                </h3>
              </div>
              <p className="pt-2 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {athlete.notes}
              </p>
            </motion.div>
          )}

          {/* Bottom Action: Edit Record Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <button
              type="button"
              onClick={() => onEdit(athlete)}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
              <Edit3 className="w-4 h-4" />
              ویرایش کامل پرونده ورزشکار
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal Dialog */}
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
              className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-darkBorder z-10 text-center"
              dir="rtl"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7" />
              </div>

              <h4 className="text-base font-black text-slate-900 dark:text-white mb-2">
                حذف ورزشکار از سیستم؟
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                آیا از حذف پرونده{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {athlete.firstName} {athlete.lastName}
                </span>{' '}
                اطمینان دارید؟ تمام سوابق و اطلاعات ایشان به طور دائم پاک خواهد شد.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(athlete);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                >
                  بله، حذف کن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
