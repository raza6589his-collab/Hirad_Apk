import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  toPersianDigits,
  toEnglishDigits,
  getTodayJalali,
  getDaysInJalaliMonth,
  jalaliToGregorian,
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

  useEffect(() => {
    if (isOpen) {
      const parsed = parseDateString(value);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      setViewMode('days');
    }
  }, [isOpen, value]);

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
    // In Persian calendar, week starts on Saturday (شنبه)
    // Sunday (0) -> index 1
    // Monday (1) -> index 2
    // Tuesday (2) -> index 3
    // Wednesday (3) -> index 4
    // Thursday (4) -> index 5
    // Friday (5) -> index 6
    // Saturday (6) -> index 0
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

  const handleConfirm = () => {
    const formatted = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}/${String(
      selectedDay
    ).padStart(2, '0')}`;
    onChange(formatted);
    onClose();
  };

  // Generate Year List for year selection
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

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
                  className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-colors ${
                    viewMode === 'months'
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  {JALALI_MONTH_NAMES[selectedMonth - 1]}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                  className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-colors ${
                    viewMode === 'years'
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  {toPersianDigits(selectedYear)}
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
            <div className="p-4 flex-1 overflow-y-auto min-h-[260px]">
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

              {/* Year Selection View */}
              {viewMode === 'years' && (
                <div className="grid grid-cols-4 gap-2 py-2 max-h-[240px] overflow-y-auto">
                  {years.map((y) => {
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
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                            : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkBorder'
                        }`}
                      >
                        {toPersianDigits(y)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-darkBorder/60 bg-slate-50/60 dark:bg-darkSubtle/40 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSetToday}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                امروز
              </button>

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
