import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  ArrowUpDown,
  Filter,
  Phone,
  MessageSquare,
  Trash2,
  Dumbbell,
  Users,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Bell,
  AlertCircle,
  Sparkles,
  History,
} from 'lucide-react';
import { Athlete, SortOption, PaymentFilter } from '../types/athlete';
import { Avatar } from './Avatar';
import { ThemeToggle } from './ThemeToggle';
import { formatCurrencyToman } from '../utils/validation';
import { toPersianDigits } from '../utils/jalali';

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
  onOpenAddModal: () => void;
  onDeleteAthlete: (athlete: Athlete) => void;
  onOpenAttendance?: () => void;
  onOpenUpdates?: () => void;
  newlyAddedId: string | null;
  onRefresh: () => Promise<void>;
}

// Persian alphabet for roster grouping and quick-jump index
const PERSIAN_ALPHABET = [
  'آ', 'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط',
  'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن',
  'و', 'ه', 'ی'
];

export const AthleteList: React.FC<AthleteListProps> = ({
  athletes,
  onSelectAthlete,
  onOpenAddModal,
  onDeleteAthlete,
  onOpenAttendance,
  onOpenUpdates,
  newlyAddedId,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterBy, setFilterBy] = useState<PaymentFilter>('all');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipedAthleteId, setSwipedAthleteId] = useState<string | null>(null);
  const [activeScrubLetter, setActiveScrubLetter] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Step 1: Filter Athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter((ath) => {
      // Payment status filter
      if (filterBy === 'unpaid' && (!ath.tuitionUnpaid || ath.tuitionUnpaid <= 0)) {
        return false;
      }
      if (filterBy === 'paid' && ath.tuitionUnpaid && ath.tuitionUnpaid > 0) {
        return false;
      }

      // Live search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const fullName = `${ath.firstName} ${ath.lastName}`.toLowerCase();
      const mobile = ath.mobileNumber.toLowerCase();
      const national = ath.nationalId.toLowerCase();
      return fullName.includes(q) || mobile.includes(q) || national.includes(q);
    });
  }, [athletes, searchQuery, filterBy]);

  // Step 2: Sort Athletes - GUARANTEED independent & composable
  const sortedAthletes = useMemo(() => {
    const list = [...filteredAthletes];
    const collator = new Intl.Collator('fa', { sensitivity: 'base', numeric: true });

    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.trim();
          const nameB = `${b.firstName} ${b.lastName}`.trim();
          return collator.compare(nameA, nameB);
        });
      case 'name-desc':
        return list.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.trim();
          const nameB = `${b.firstName} ${b.lastName}`.trim();
          return collator.compare(nameB, nameA);
        });
      case 'date-newest':
        return list.sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));
      case 'date-oldest':
        return list.sort((a, b) => a.registrationDate.localeCompare(b.registrationDate));
      case 'unpaid-first':
        return list.sort((a, b) => (b.tuitionUnpaid || 0) - (a.tuitionUnpaid || 0));
      default:
        return list;
    }
  }, [filteredAthletes, sortBy]);

  // Step 3: Group by letter for alphabetical section headers (scoped to filtered results!)
  const groupedAthletes = useMemo(() => {
    if (sortBy !== 'name-asc') {
      return { 'همه ورزشکاران': sortedAthletes };
    }

    const groups: { [letter: string]: Athlete[] } = {};
    sortedAthletes.forEach((ath) => {
      let firstChar = ath.firstName.trim().charAt(0) || 'سایر';
      if (firstChar === 'آ') firstChar = 'ا';
      if (!groups[firstChar]) groups[firstChar] = [];
      groups[firstChar].push(ath);
    });

    // Ensure groups are returned strictly ordered by PERSIAN_ALPHABET
    const orderedGroups: { [letter: string]: Athlete[] } = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const idxA = PERSIAN_ALPHABET.indexOf(a);
      const idxB = PERSIAN_ALPHABET.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b, 'fa');
    });

    sortedKeys.forEach((key) => {
      orderedGroups[key] = groups[key];
    });

    return orderedGroups;
  }, [sortedAthletes, sortBy]);

  // Available letters present in the current view for quick-jump index
  const availableLetters = useMemo(() => {
    return Object.keys(groupedAthletes).filter((l) => l !== 'همه ورزشکاران');
  }, [groupedAthletes]);

  const scrollToLetter = (letter: string) => {
    setActiveScrubLetter(letter);
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => setActiveScrubLetter(null), 900);
  };

  return (
    <div
      onClick={() => setSwipedAthleteId(null)}
      className="flex flex-col h-full bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-white relative select-none"
    >
      {/* Top App Bar - Fixed, Non-shifting with EXACTLY 4 Visible Controls */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-darkCard/95 border-b border-slate-200/80 dark:border-darkBorder backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-900 border border-brand-500/30 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
              <img src="/app-icon.png" alt="باشگاه هیراد" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                  باشگاه هیراد
                </h1>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                  مربی: عبداللهی
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {toPersianDigits(athletes.length)} ورزشکار ثبت شده
              </p>
            </div>
          </div>

          {/* Exactly 4 Standardized Action Buttons (44x44px touch targets) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 1. Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                } else {
                  setSearchQuery('');
                }
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                isSearchOpen
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 ring-2 ring-brand-500/30'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder border border-slate-200/60 dark:border-darkBorder'
              }`}
              aria-label="جستجو در لیست ورزشکاران"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* 2. Quick Attendance Check-in Button */}
            {onOpenAttendance && (
              <button
                type="button"
                onClick={onOpenAttendance}
                className="w-11 h-11 rounded-2xl shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center border border-emerald-500/25 active:scale-95 transition-all shadow-sm"
                aria-label="ثبت سریع حضور ورزشکار با کد ملی"
              >
                <UserCheck className="w-5 h-5" />
              </button>
            )}

            {/* 3. Sort & Options Menu Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all relative active:scale-95 ${
                isSortMenuOpen || filterBy !== 'all' || sortBy !== 'name-asc'
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/30'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder border border-slate-200/60 dark:border-darkBorder'
              }`}
              aria-label="مرتب‌سازی و گزینه‌های مدیریت"
            >
              <ArrowUpDown className="w-5 h-5" />
              {(filterBy !== 'all' || sortBy !== 'name-asc') && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-darkCard" />
              )}
            </button>

            {/* 4. Theme Toggle (Directly reachable on header) */}
            <ThemeToggle className="shrink-0" />
          </div>
        </div>

        {/* Expandable Live Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-3"
            >
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام، شماره موبایل یا کد ملی..."
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-2xl bg-slate-100 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-3"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Filter Chips - FIXED UNCHANGING ORDER, NO HORIZONTAL JUMPING */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 pb-1 w-full">
          {/* Chip 1: همه */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilterBy('all');
            }}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
              filterBy === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-darkSubtle text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder'
            }`}
          >
            همه ({toPersianDigits(athletes.length)})
          </button>

          {/* Chip 2: دارای بدهی */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilterBy('unpaid');
            }}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
              filterBy === 'unpaid'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-darkSubtle text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">
              بدهی (
              {toPersianDigits(
                athletes.filter((a) => a.tuitionUnpaid && a.tuitionUnpaid > 0).length
              )}
              )
            </span>
          </button>

          {/* Chip 3: تسویه کامل */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilterBy('paid');
            }}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
              filterBy === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-darkSubtle text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              تسویه (
              {toPersianDigits(
                athletes.filter((a) => !a.tuitionUnpaid || a.tuitionUnpaid === 0).length
              )}
              )
            </span>
          </button>
        </div>
      </header>

      {/* Sort Menu Drawer & Operations (Visible text, 44px targets, no touch tooltips) */}
      <AnimatePresence>
        {isSortMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="z-20 bg-white dark:bg-darkCard border-b border-slate-200 dark:border-darkBorder p-4 shadow-xl flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-darkBorder/60">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-brand-500" />
                مرتب‌سازی و امکانات مدیریت
              </span>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSubtle"
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Options with 4 Distinct Buttons & Icons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                ترتیب نمایش اعضا:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('name-asc');
                    setIsSortMenuOpen(false);
                  }}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-right flex items-center gap-2 ${
                    sortBy === 'name-asc'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">نام (الف تا ی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('unpaid-first');
                    setIsSortMenuOpen(false);
                  }}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-right flex items-center gap-2 ${
                    sortBy === 'unpaid-first'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-100 dark:bg-darkSubtle text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">ابتدا بدهکاران</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('date-newest');
                    setIsSortMenuOpen(false);
                  }}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-right flex items-center gap-2 ${
                    sortBy === 'date-newest'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="truncate">جدیدترین اعضا</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy('date-oldest');
                    setIsSortMenuOpen(false);
                  }}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-right flex items-center gap-2 ${
                    sortBy === 'date-oldest'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span className="truncate">قدیمی‌ترین اعضا</span>
                </button>
              </div>
            </div>

            {/* Quick Actions (moved from header to avoid clutter, visible text, 44px touch targets) */}
            <div className="pt-2 border-t border-slate-100 dark:border-darkBorder/60 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                ابزارها و عملیات:
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    await handlePullToRefresh();
                    setIsSortMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-brand-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>تازه‌سازی اطلاعات باشگاه</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">بروزرسانی داده‌ها</span>
                </button>

                {onOpenUpdates && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortMenuOpen(false);
                      onOpenUpdates();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-between border border-amber-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      <span>بررسی و دانلود نسخه جدید (APK)</span>
                    </div>
                    <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-md">
                      دانلود
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Athlete List Content */}
      <div className="flex-1 overflow-y-auto relative flex">
        {/* Athlete Rows Container */}
        <div className="flex-1 pb-24">
          {sortedAthletes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-8 text-center mt-12 space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-950/40 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-xl shadow-brand-500/10">
                {searchQuery ? <Search className="w-10 h-10" /> : <Dumbbell className="w-10 h-10" />}
              </div>
              <div className="max-w-xs space-y-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {searchQuery ? 'ورزشکاری با این مشخصات یافت نشد' : 'هنوز ورزشکاری ثبت نشده است'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {searchQuery
                    ? `هیچ ورزشکاری با مشخصات «${searchQuery}» پیدا نشد. عبارت دیگری را امتحان کنید.`
                    : 'اطلاعات ورزشکاران، شهریه، سوابق پرداخت و حضور و غیاب در این بخش مدیریت می‌شوند.'}
                </p>
              </div>

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-darkBorder transition-all"
                >
                  <X className="w-4 h-4" />
                  پاک کردن جستجو
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  ثبت اولین ورزشکار
                </button>
              )}
            </motion.div>
          ) : (
            Object.entries(groupedAthletes).map(([groupTitle, list]) => (
              <div
                key={groupTitle}
                ref={(el) => {
                  sectionRefs.current[groupTitle] = el;
                }}
              >
                {/* Alphabet Section Header (Scoped to active filtered results!) */}
                {groupTitle !== 'همه ورزشکاران' && (
                  <div className="sticky top-0 z-10 px-5 py-1.5 bg-slate-100/90 dark:bg-darkSubtle/90 backdrop-blur-sm border-y border-slate-200/50 dark:border-darkBorder/40">
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                      {groupTitle}
                    </span>
                  </div>
                )}

                {/* Athlete Item Rows */}
                <div className="divide-y divide-slate-100 dark:divide-darkBorder/50">
                  {list.map((ath) => {
                    const isNew = newlyAddedId === ath.id;
                    const hasDebt = !!(ath.tuitionUnpaid && ath.tuitionUnpaid > 0);
                    const isSwiped = swipedAthleteId === ath.id;

                    return (
                      <div
                        key={ath.id}
                        className="relative overflow-hidden bg-white dark:bg-darkCard"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSwiped) {
                            setSwipedAthleteId(null);
                          } else {
                            onSelectAthlete(ath);
                          }
                        }}
                      >
                        {/* Swipe Quick Action Shortcuts (Cleanly docked on the left in RTL, 44x44px touch targets) */}
                        {isSwiped && (
                          <div
                            className="absolute inset-y-0 left-0 flex items-center px-3 gap-2 bg-slate-100 dark:bg-darkSubtle z-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`tel:${ath.mobileNumber}`}
                              className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                              aria-label="تماس تلفنی"
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                            <a
                              href={`sms:${ath.mobileNumber}`}
                              className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                              aria-label="ارسال پیامک"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setAthleteToDelete(ath);
                              }}
                              className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                              aria-label="حذف ورزشکار"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {/* Front Row (WhatsApp-Style) */}
                        <motion.div
                          layout
                          whileTap={{ scale: 0.985 }}
                          drag="x"
                          dragConstraints={{ left: -155, right: 0 }}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -40) {
                              setSwipedAthleteId(ath.id);
                            } else {
                              setSwipedAthleteId(null);
                            }
                          }}
                          animate={{ x: isSwiped ? -150 : 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          className={`relative z-10 flex items-center justify-between px-4 py-3.5 bg-white dark:bg-darkCard cursor-pointer hover:bg-slate-50 dark:hover:bg-darkSubtle/60 transition-colors ${
                            isNew ? 'animate-flash-highlight' : ''
                          }`}
                        >
                          {/* Left: Avatar + Details */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Shared Element Avatar with Clean Initials */}
                            <Avatar
                              firstName={ath.firstName}
                              lastName={ath.lastName}
                              photo={ath.photo}
                              size="md"
                              layoutId={`avatar-${ath.id}`}
                              status={hasDebt ? 'unpaid' : 'paid'}
                              showStatusBadge={true}
                            />

                            {/* Text Info */}
                            <div className="min-w-0 flex-1">
                              {/* Full Name (Shared Element) */}
                              <motion.h4
                                layoutId={`name-${ath.id}`}
                                className="text-sm font-bold text-slate-900 dark:text-white truncate"
                              >
                                {ath.firstName} {ath.lastName}
                              </motion.h4>

                              {/* Secondary line: payment status AND consistent status dot */}
                              <div className="flex items-center gap-2 mt-0.5">
                                {/* Consistent Status Dot for EVERY row */}
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    hasDebt
                                      ? 'bg-rose-500 ring-2 ring-rose-500/20 animate-pulse'
                                      : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                  }`}
                                />

                                {hasDebt ? (
                                  <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 truncate">
                                    بدهی: {formatCurrencyToman(ath.tuitionUnpaid)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                    تسویه کامل
                                  </span>
                                )}

                                <span className="text-slate-300 dark:text-slate-600">•</span>

                                <span className="text-xs text-slate-500 dark:text-slate-400 tracking-tight">
                                  <bdi dir="ltr">{toPersianDigits(ath.mobileNumber)}</bdi>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Trailing date (WhatsApp style timestamp) */}
                          <div className="flex flex-col items-end gap-1 shrink-0 pr-2">
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              <bdi dir="ltr">
                                {toPersianDigits(
                                  ath.registrationDate.split('/')[1] +
                                    '/' +
                                    ath.registrationDate.split('/')[2]
                                )}
                              </bdi>
                            </span>
                            <div className="flex items-center gap-1">
                              {ath.attendances && ath.attendances.length > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">
                                  {toPersianDigits(ath.attendances.length)} جلسه
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-darkBorder px-1.5 py-0.5 rounded font-medium">
                                {ath.trainingCategory?.split(' ')[0] || 'بدنسازی'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Scroll Alphabet Index Bar with Large Touch Targets (min 36px height) */}
        {availableLetters.length > 1 && (
          <div className="w-8 py-3 flex flex-col items-center justify-start shrink-0 z-20 sticky top-16 right-0 select-none bg-white/70 dark:bg-darkCard/70 backdrop-blur-md rounded-l-2xl border-l border-y border-slate-200/50 dark:border-darkBorder/50 shadow-sm my-2">
            {availableLetters.map((letter) => {
              const isActive = activeScrubLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToLetter(letter);
                  }}
                  className={`w-7 h-9 my-0.5 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white scale-125 shadow-md shadow-brand-500/30'
                      : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 active:scale-110'
                  }`}
                  aria-label={`پرش به حرف ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Floating Scrub Indicator Bubble */}
        <AnimatePresence>
          {activeScrubLetter && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-3xl bg-brand-500 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-brand-500/50 z-50 pointer-events-none"
            >
              {activeScrubLetter}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button (Cleanly contained INSIDE mobile frame only when roster has athletes, min 56x56px) */}
      {athletes.length > 0 && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenAddModal}
          aria-label="افزودن ورزشکار جدید"
          className="absolute bottom-5 left-5 z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 text-white shadow-xl shadow-brand-500/35 flex items-center justify-center focus:outline-none ring-4 ring-white/80 dark:ring-darkBg/80"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </motion.button>
      )}

      {/* Delete Confirmation Modal for Swipe Action */}
      <AnimatePresence>
        {athleteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  حذف پرونده ورزشکار
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  آیا از حذف پرونده {athleteToDelete.firstName} {athleteToDelete.lastName} اطمینان دارید؟ تمام سوابق پرداخت و حضور و غیاب وی حذف خواهند شد.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAthleteToDelete(null)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-darkSubtle text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ath = athleteToDelete;
                    setAthleteToDelete(null);
                    setSwipedAthleteId(null);
                    onDeleteAthlete(ath);
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-colors"
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
