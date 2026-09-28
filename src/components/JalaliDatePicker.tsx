import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  toPersianDigits,
  toEnglishDigits,
  getTodayJalali,
  getDaysInJalaliMonth,
  jalaliToGregorian,
  gregorianToJalali,
  formatJalaliPretty,
} from '../utils/jalali';

interface JalaliDatePickerProps {
  isOpen: boolean;
  value: string; // "YYYY/MM/DD"
  onChange: (date: string) => void;
  onClose: () => void;
  title?: string;
  minYear?: number;
  maxYear?: number;
}

const DECADES = [
  { label: 'دهه ۵۰', start: 1350, end: 1359 },
  { label: 'دهه ۶۰', start: 1360, end: 1369 },
  { label: 'دهه ۷۰', start: 1370, end: 1379 },
  { label: 'دهه ۸۰', start: 1380, end: 1389 },
  { label: 'دهه ۹۰', start: 1390, end: 1399 },
  { label: 'دهه ۴۰', start: 1340, end: 1349 },
  { label: 'دهه ۱۴۰۰', start: 1400, end: 1409 },
];

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  title = 'انتخاب تاریخ',
  minYear = 1330,
  maxYear = 1410,
}) => {
  const today = getTodayJalali();

  // Parse initial value or default to today
  const parseDateString = (str: string) => {
    if (!str) return { year: today.year, month: today.month, day: today.day };
    const clean = toEnglishDigits(str);
    const parts = clean.split(/[\/\-]/);
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10) || today.year,
        month: parseInt(parts[1], 10) || today.month,
        day: parseInt(parts[2], 10) || today.day,
      };
    }
    return { year: today.year, month: today.month, day: today.day };
  };

  const initial = parseDateString(value);
  const [selectedYear, setSelectedYear] = useState<number>(initial.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
  const [selectedDay, setSelectedDay] = useState<number>(initial.day);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearSearch, setYearSearch] = useState<string>('');
  const yearInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseDateString(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      setViewMode('days');
      setYearSearch('');
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (viewMode === 'years') {
      setTimeout(() => yearInputRef.current?.focus(), 100);
    }
  }, [viewMode]);

  // Adjust day if exceeds days in month
  useEffect(() => {
    const maxDays = getDaysInJalaliMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const daysInCurrentMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);

  // Calculate starting day of week for the 1st of this Jalali month
  const getFirstDayOfWeek = () => {
    const { gy, gm, gd } = jalaliToGregorian(selectedYear, selectedMonth, 1);
    const date = new Date(gy, gm - 1, gd);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    return (day + 1) % 7;
  };

  const firstDayOffset = getFirstDayOfWeek();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleSetToday = () => {
    setSelectedYear(today.year);
    setSelectedMonth(today.month);
    setSelectedDay(today.day);
    setViewMode('days');
  };

  const handleSetYesterday = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const { jy, jm, jd } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setSelectedYear(jy);
    setSelectedMonth(jm);
    setSelectedDay(jd);
    setViewMode('days');
  };

  const handleConfirm = () => {
    const formatted = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}/${String(
      selectedDay
    ).padStart(2, '0')}`;
    onChange(formatted);
    onClose();
  };

  // Generate Year List
  const allYears: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    allYears.push(y);
  }

  // Filtered years based on search
  const cleanSearch = toEnglishDigits(yearSearch).trim();
  const filteredYears = cleanSearch
    ? allYears.filter((y) => y.toString().includes(cleanSearch))
    : allYears;

  const handleYearSearchChange = (val: string) => {
    const clean = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setYearSearch(clean);
    if (clean.length === 4) {
      const yr = parseInt(clean, 10);
      if (yr >= minYear && yr <= maxYear) {
        setSelectedYear(yr);
        setViewMode('months');
        setYearSearch('');
      }
    }
  };

  const currentDateString = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}/${String(
    selectedDay
  ).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-darkCard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-darkBorder overflow-hidden z-10 flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium tracking-wide uppercase opacity-90 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {title}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xl font-black tracking-tight flex items-baseline gap-2">
                <span>{formatJalaliPretty(currentDateString)}</span>
              </div>
            </div>

            {/* Sub-header / Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-darkBorder/60 bg-slate-50/50 dark:bg-darkSubtle/30">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    viewMode === 'months'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  {JALALI_MONTH_NAMES[selectedMonth - 1]}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'years'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  <span>سال {toPersianDigits(selectedYear)}</span>
                  <span className="text-[10px] opacity-75">(تغییر سریع)</span>
                </button>
              </div>

              {viewMode === 'days' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder transition-colors"
                    title="ماه بعد"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder transition-colors"
                    title="ماه قبل"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* View Body */}
            <div className="p-4 flex-1 overflow-y-auto min-h-[280px]">
              {/* Day Grid View */}
              {viewMode === 'days' && (
                <div>
                  {/* Weekday Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((w, idx) => (
                      <div
                        key={idx}
                        className={`text-xs font-bold py-1 ${
                          idx === 6 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Empty slots for week alignment */}
                    {Array.from({ length: firstDayOffset }).map((_, idx) => (
                      <div key={`offset-${idx}`} className="w-8 h-8 mx-auto" />
                    ))}

                    {/* Day numbers */}
                    {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                      const dayNumber = idx + 1;
                      const isSelected = selectedDay === dayNumber;
                      const isToday =
                        selectedYear === today.year &&
                        selectedMonth === today.month &&
                        dayNumber === today.day;
                      const isFriday = (firstDayOffset + idx) % 7 === 6;

                      return (
                        <button
                          key={dayNumber}
                          type="button"
                          onClick={() => setSelectedDay(dayNumber)}
                          className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-sm font-semibold transition-all relative ${
                            isSelected
                              ? 'bg-brand-500 text-white font-bold shadow-md shadow-brand-500/30 scale-105'
                              : isToday
                              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 ring-1.5 ring-brand-500 font-bold'
                              : isFriday
                              ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkBorder'
                          }`}
                        >
                          {toPersianDigits(dayNumber)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Month Selection View */}
              {viewMode === 'months' && (
                <div className="grid grid-cols-3 gap-2.5 py-2">
                  {JALALI_MONTH_NAMES.map((mName, idx) => {
                    const mNumber = idx + 1;
                    const isSelected = selectedMonth === mNumber;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(mNumber);
                          setViewMode('days');
                        }}
                        className={`py-3 px-2 rounded-xl text-sm font-bold text-center transition-all ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                            : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Enhanced Year Selection View with Direct Search & Decades */}
              {viewMode === 'years' && (
                <div className="space-y-3">
                  {/* Direct Type / Search Input */}
                  <div className="relative">
                    <input
                      ref={yearInputRef}
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      maxLength={4}
                      value={yearSearch}
                      onChange={(e) => handleYearSearchChange(e.target.value)}
                      placeholder="تایپ مستقیم سال (مثلاً ۱۳۶۵)..."
                      className="w-full text-right pr-9 pl-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    {yearSearch && (
                      <button
                        type="button"
                        onClick={() => setYearSearch('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>

                  {/* Decade Quick Jump Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      پرش سریع به دهه‌ها:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DECADES.map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => {
                            setYearSearch(d.start.toString().slice(0, 3));
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                        >
                          {d.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setYearSearch('')}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-darkBorder text-slate-600 dark:text-slate-300"
                      >
                        همه سال‌ها
                      </button>
                    </div>
                  </div>

                  {/* Year Grid */}
                  <div className="grid grid-cols-4 gap-2 py-1 max-h-[190px] overflow-y-auto">
                    {filteredYears.map((y) => {
                      const isSelected = selectedYear === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setSelectedYear(y);
                            setViewMode('months');
                          }}
                          className={`py-2 rounded-xl text-sm font-bold text-center transition-all ${
                            isSelected
                              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-500'
                              : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-darkBorder'
                          }`}
                        >
                          {toPersianDigits(y)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-darkBorder/60 bg-slate-50/60 dark:bg-darkSubtle/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  امروز
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-darkBorder hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  دیروز
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  تایید
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
