import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Clock,
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { Athlete, AttendanceRecord } from '../types/athlete';
import { toEnglishDigits, toPersianDigits, getTodayJalali } from '../utils/jalali';
import { formatCurrencyToman } from '../utils/validation';
import { Avatar } from './Avatar';

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  onRecordAttendance: (athleteId: string, attendance: AttendanceRecord) => void;
  onRegisterNewAthlete: (nationalCode?: string) => void;
}

export const QuickAttendanceModal: React.FC<QuickAttendanceModalProps> = ({
  isOpen,
  onClose,
  athletes,
  onRecordAttendance,
  onRegisterNewAthlete,
}) => {
  const [nationalIdInput, setNationalIdInput] = useState('');
  const [matchedAthlete, setMatchedAthlete] = useState<Athlete | null>(null);
  const [successAthlete, setSuccessAthlete] = useState<{ athlete: Athlete; sessionNum: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNationalIdInput('');
      setMatchedAthlete(null);
      setSuccessAthlete(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Live lookup as user types
  useEffect(() => {
    const clean = toEnglishDigits(nationalIdInput).trim();
    if (clean.length >= 10) {
      const found = athletes.find((a) => toEnglishDigits(a.nationalId) === clean);
      setMatchedAthlete(found || null);
    } else {
      setMatchedAthlete(null);
    }
  }, [nationalIdInput, athletes]);

  const handleInputChange = (val: string) => {
    const clean = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setNationalIdInput(clean);
  };

  const handleConfirmAttendance = (ath: Athlete) => {
    const today = getTodayJalali();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const pastAttendances = ath.attendances || [];
    const nextSessionNum = pastAttendances.length + 1;

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      date: today.formatted,
      time: timeStr,
      sessionNumber: nextSessionNum,
    };

    onRecordAttendance(ath.id, newRecord);

    setSuccessAthlete({ athlete: ath, sessionNum: nextSessionNum });
    setNationalIdInput('');
    setMatchedAthlete(null);

    // Auto-clear success message after 2.5s and refocus for the next athlete
    setTimeout(() => {
      setSuccessAthlete(null);
      inputRef.current?.focus();
    }, 2400);
  };

  const today = getTodayJalali();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const hasDebt = matchedAthlete ? !!(matchedAthlete.tuitionUnpaid && matchedAthlete.tuitionUnpaid > 0) : false;
  const alreadyCheckedInToday = matchedAthlete?.attendances?.some((att) => att.date === today.formatted);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-darkCard rounded-3xl shadow-2xl border border-slate-200/80 dark:border-darkBorder overflow-hidden z-10 flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">ثبت سریع حضور ورزشکار</h2>
                  <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                    <span>{today.formatted}</span>
                    <span>•</span>
                    <span>ساعت {timeStr}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* National ID Search Input */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  کد ملی ۱۰ رقمی ورزشکار را وارد کنید:
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={10}
                    value={nationalIdInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && matchedAthlete) {
                        handleConfirmAttendance(matchedAthlete);
                      }
                    }}
                    placeholder="0012345679"
                    className="w-full text-center tracking-widest text-xl font-mono py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-darkSubtle border-2 border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors shadow-inner"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
                  <span>تعداد ارقام: {toPersianDigits(nationalIdInput.length)} از ۱۰</span>
                  <span>یا دکمه Enter را برای تایید بزنید</span>
                </div>
              </div>

              {/* Success Notification Animation */}
              <AnimatePresence>
                {successAthlete && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                      حضور {successAthlete.athlete.firstName} {successAthlete.athlete.lastName} ثبت شد!
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      جلسه شماره {toPersianDigits(successAthlete.sessionNum)} • {today.formatted} ساعت {timeStr}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Matched Athlete Card */}
              <AnimatePresence>
                {matchedAthlete && !successAthlete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSubtle/60 border border-slate-200 dark:border-darkBorder space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={matchedAthlete.firstName}
                        lastName={matchedAthlete.lastName}
                        photo={matchedAthlete.photo}
                        size="md"
                        status={hasDebt ? 'unpaid' : 'paid'}
                      />
                      <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {matchedAthlete.firstName} {matchedAthlete.lastName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {matchedAthlete.trainingCategory} • {matchedAthlete.mobileNumber}
                        </p>
                      </div>
                    </div>

                    {/* Status & Session info */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-darkBorder/60">
                      {hasDebt ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          بدهی: {formatCurrencyToman(matchedAthlete.tuitionUnpaid)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تسویه کامل
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        جلسه جدید: شماره {toPersianDigits((matchedAthlete.attendances?.length || 0) + 1)}
                      </span>
                    </div>

                    {alreadyCheckedInToday && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>این ورزشکار امروز قبلاً ثبت حضور شده است.</span>
                      </div>
                    )}

                    {/* Instant Check-in Button */}
                    <button
                      type="button"
                      onClick={() => handleConfirmAttendance(matchedAthlete)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>تایید و ثبت ورود این جلسه</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Not Found Alert */}
              <AnimatePresence>
                {nationalIdInput.length === 10 && !matchedAthlete && !successAthlete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-center space-y-3"
                  >
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      ورزشکاری با کد ملی {toPersianDigits(nationalIdInput)} در باشگاه ثبت نشده است.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRegisterNewAthlete(nationalIdInput);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      ثبت‌نام این ورزشکار در باشگاه
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-darkSubtle/40 border-t border-slate-100 dark:border-darkBorder/60 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder transition-colors"
              >
                بستن
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
