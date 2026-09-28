import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  CreditCard,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Athlete, AttendanceRecord } from '../types/athlete';
import { toEnglishDigits, toPersianDigits, getTodayJalali } from '../utils/jalali';
import { formatCurrencyToman } from '../utils/currency';
import { Avatar } from './Avatar';

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  onRecordAttendance: (athleteId: string, attendance: AttendanceRecord) => void;
  onUndoAttendance?: (athleteId: string, attendanceId: string) => void;
  onRegisterNewAthlete: (nationalCode?: string) => void;
}

export const QuickAttendanceModal: React.FC<QuickAttendanceModalProps> = ({
  isOpen,
  onClose,
  athletes,
  onRecordAttendance,
  onUndoAttendance,
  onRegisterNewAthlete,
}) => {
  const [nationalIdInput, setNationalIdInput] = useState('');
  const [duplicateWarningAthlete, setDuplicateWarningAthlete] = useState<Athlete | null>(null);
  const [recentCheckIn, setRecentCheckIn] = useState<{
    athlete: Athlete;
    attendanceId: string;
    sessionNum: number;
    timeStr: string;
  } | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number>(5);

  const inputRef = useRef<HTMLInputElement>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = getTodayJalali();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setNationalIdInput('');
      setDuplicateWarningAthlete(null);
      setRecentCheckIn(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    };
  }, []);

  const triggerAttendance = (ath: Athlete) => {
    const todayJalali = getTodayJalali();
    const currentTime = new Date();
    const formattedTime = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    const nextSessionNum = (ath.attendances?.length || 0) + 1;
    const attendanceId = 'att-' + Date.now();

    const newRecord: AttendanceRecord = {
      id: attendanceId,
      date: todayJalali.formatted,
      time: formattedTime,
      sessionNumber: nextSessionNum,
    };

    onRecordAttendance(ath.id, newRecord);

    setRecentCheckIn({
      athlete: ath,
      attendanceId,
      sessionNum: nextSessionNum,
      timeStr: formattedTime,
    });
    setNationalIdInput('');
    setDuplicateWarningAthlete(null);
    setUndoSecondsLeft(5);

    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoIntervalRef.current = setInterval(() => {
      setUndoSecondsLeft((prev) => {
        if (prev <= 1) {
          if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
          setRecentCheckIn(null);
          setTimeout(() => inputRef.current?.focus(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInputChange = (val: string) => {
    const clean = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setNationalIdInput(clean);

    // Auto-submit when exactly 10 valid digits are typed
    if (clean.length === 10) {
      const found = athletes.find((a) => toEnglishDigits(a.nationalId) === clean);
      if (found) {
        const todayDate = getTodayJalali().formatted;
        const alreadyCheckedInToday = found.attendances?.some((att) => att.date === todayDate);
        if (alreadyCheckedInToday) {
          setDuplicateWarningAthlete(found);
        } else {
          triggerAttendance(found);
        }
      }
    } else {
      setDuplicateWarningAthlete(null);
    }
  };

  const handleUndo = () => {
    if (!recentCheckIn) return;
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    if (onUndoAttendance) {
      onUndoAttendance(recentCheckIn.athlete.id, recentCheckIn.attendanceId);
    }
    setNationalIdInput(recentCheckIn.athlete.nationalId);
    setRecentCheckIn(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isUnknown10Digit = nationalIdInput.length === 10 &&
    !athletes.some((a) => toEnglishDigits(a.nationalId) === nationalIdInput);

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
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">ثبت سریع حضور ورزشکار</h2>
                  <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                    <span>{today.formattedPersian}</span>
                    <span>•</span>
                    <span>ساعت {toPersianDigits(timeStr)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
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
                    value={toPersianDigits(nationalIdInput)}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="مثال: ۰۰۱۲۳۴۵۶۷۹"
                    className="w-full text-center tracking-widest text-xl py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-darkSubtle border-2 border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors shadow-inner font-bold"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1 font-semibold">
                  <span>تعداد ارقام: {toPersianDigits(nationalIdInput.length)} از ۱۰</span>
                  <span>ثبت خودکار پس از تکمیل ۱۰ رقم</span>
                </div>
              </div>

              {/* Success Notification Animation with Undo Button */}
              <AnimatePresence>
                {recentCheckIn && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Avatar
                        firstName={recentCheckIn.athlete.firstName}
                        lastName={recentCheckIn.athlete.lastName}
                        photo={recentCheckIn.athlete.photo}
                        size="md"
                        status="paid"
                      />
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            حضور {recentCheckIn.athlete.firstName} {recentCheckIn.athlete.lastName} ثبت شد!
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          جلسه شماره {toPersianDigits(recentCheckIn.sessionNum)} • ساعت {toPersianDigits(recentCheckIn.timeStr)}
                        </p>
                      </div>
                    </div>

                    {/* Undo action bar with timer */}
                    <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        امکان لغو تا {toPersianDigits(undoSecondsLeft)} ثانیه دیگر
                      </span>
                      <button
                        type="button"
                        onClick={handleUndo}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        لغو / بازگشت (Undo)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Duplicate Same-Day Check-in Warning */}
              <AnimatePresence>
                {duplicateWarningAthlete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 space-y-3"
                  >
                    <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black">هشدار: حضور قبلی در امروز</h4>
                        <p className="text-[11px] font-medium mt-0.5">
                          «{duplicateWarningAthlete.firstName} {duplicateWarningAthlete.lastName}» امروز قبلاً ثبت حضور شده است.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDuplicateWarningAthlete(null);
                          setNationalIdInput('');
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-darkBorder text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerAttendance(duplicateWarningAthlete)}
                        className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-colors"
                      >
                        ثبت جلسه مجدد
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Not Found Alert with Graceful Registration Button */}
              <AnimatePresence>
                {isUnknown10Digit && !recentCheckIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-center space-y-3"
                  >
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      ورزشکاری با کد ملی <bdi dir="ltr">{toPersianDigits(nationalIdInput)}</bdi> در باشگاه ثبت نشده است.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRegisterNewAthlete(nationalIdInput);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md active:scale-95"
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
