import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Share2,
  RefreshCw,
  X,
  Users,
  CreditCard,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Athlete } from '../types/athlete';
import {
  generateBackupData,
  validateBackupData,
  restoreBackupData,
  BackupData,
} from '../utils/storage';
import { toPersianDigits, getTodayJalali } from '../utils/jalali';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  onAthletesRestored: (newAthletes: Athlete[]) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  athletes,
  onAthletesRestored,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

  // Import state
  const [importedText, setImportedText] = useState('');
  const [validatedBackup, setValidatedBackup] = useState<BackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPayments = athletes.reduce((sum, a) => sum + (a.payments?.length || 0), 0);
  const totalAttendances = athletes.reduce((sum, a) => sum + (a.attendances?.length || 0), 0);
  const today = getTodayJalali();

  // Export 1: Download JSON file
  const handleDownloadFile = () => {
    try {
      const backup = generateBackupData(athletes);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `hirad-club-backup-${today.formatted.replace(/\//g, '-')}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast('success', `فایل پشتیبان با موفقیت دانلود شد: ${filename}`);
    } catch {
      onShowToast('error', 'خطا در ایجاد و دانلود فایل پشتیبان');
    }
  };

  // Export 2: Copy JSON text
  const handleCopyText = async () => {
    try {
      const backup = generateBackupData(athletes);
      const jsonStr = JSON.stringify(backup);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      onShowToast('success', 'کد کامل پشتیبان در حافظه کپی شد (می‌توانید در واتساپ یا یادداشت ذخیره کنید)');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onShowToast('error', 'خطا در کپی متن پشتیبان');
    }
  };

  // Export 3: Native Web Share API
  const handleShare = async () => {
    try {
      const backup = generateBackupData(athletes);
      const jsonStr = JSON.stringify(backup, null, 2);
      const filename = `hirad-backup-${today.formatted.replace(/\//g, '-')}.json`;

      if (navigator.share) {
        const file = new File([jsonStr], filename, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'نسخه پشتیبان باشگاه هیراد',
            text: `پشتیبان اطلاعات ${athletes.length} ورزشکار باشگاه هیراد - تاریخ ${today.formatted}`,
            files: [file],
          });
          onShowToast('success', 'فایل پشتیبان به اشتراک گذاشته شد');
          return;
        }
      }
      // Fallback to copy
      handleCopyText();
    } catch {
      // User may cancel share
    }
  };

  // Import: Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setValidationError(null);
    setValidatedBackup(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportedText(text);
        const parsed = JSON.parse(text);
        const check = validateBackupData(parsed);

        if (!check.valid || !check.data) {
          setValidationError(check.error || 'فایل انتخاب شده معتبر نیست.');
        } else {
          setValidatedBackup(check.data);
          onShowToast('info', 'فایل پشتیبان تایید شد. نحوه بازیابی را انتخاب کنید.');
        }
      } catch {
        setValidationError('فرمت فایل نامعتبر است. لطفاً فایل JSON پشتیبان باشگاه هیراد را انتخاب فرمایید.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // Import: Handle Manual Text Input Validation
  const handleValidateText = () => {
    if (!importedText.trim()) {
      setValidationError('لطفاً متن کد پشتیبان را وارد کنید یا فایل آن را انتخاب نمایید.');
      return;
    }

    try {
      const parsed = JSON.parse(importedText.trim());
      const check = validateBackupData(parsed);
      if (!check.valid || !check.data) {
        setValidationError(check.error || 'متن وارد شده معتبر نیست.');
        setValidatedBackup(null);
      } else {
        setValidationError(null);
        setValidatedBackup(check.data);
        onShowToast('info', 'اطلاعات پشتیبان با موفقیت تایید شد.');
      }
    } catch {
      setValidationError('متن وارد شده فرمت صحیح JSON ندارد.');
      setValidatedBackup(null);
    }
  };

  // Restore Execution
  const handleExecuteRestore = () => {
    if (!validatedBackup) return;

    try {
      const restored = restoreBackupData(validatedBackup, athletes, restoreMode);
      onAthletesRestored(restored);
      onShowToast(
        'success',
        `اطلاعات ${restored.length} ورزشکار با موفقیت بازیابی و مستقر گردید ✅`
      );
      onClose();
    } catch {
      onShowToast('error', 'خطا در بازیابی اطلاعات.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white dark:bg-darkCard rounded-3xl shadow-2xl border border-slate-200 dark:border-darkBorder overflow-hidden flex flex-col max-h-[92vh]"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-darkBorder/60 flex items-center justify-between bg-slate-50/50 dark:bg-darkSubtle/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    پشتیبان‌گیری و بازیابی اطلاعات باشگاه
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    جلوگیری از پاک شدن پرونده‌ها، شهریه‌ها و حضور و غیاب
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkBorder"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="grid grid-cols-2 p-2 mx-4 mt-3 bg-slate-100 dark:bg-darkSubtle rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('export');
                  setValidationError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'export'
                    ? 'bg-white dark:bg-darkCard text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                تهیه نسخه پشتیبان (خروجی)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'import'
                    ? 'bg-white dark:bg-darkCard text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                بازیابی و ریکاوری (ورودی)
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'export' ? (
                /* EXPORT SECTION */
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSubtle border border-slate-200/70 dark:border-darkBorder space-y-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      خلاصه اطلاعات فعلی باشگاه جهت پشتیبان‌گیری:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-darkCard text-center border border-slate-200/50 dark:border-darkBorder">
                        <span className="text-[10px] text-slate-400 block">ورزشکاران</span>
                        <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                          {toPersianDigits(athletes.length)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-darkCard text-center border border-slate-200/50 dark:border-darkBorder">
                        <span className="text-[10px] text-slate-400 block">تراکنش‌های مالی</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(totalPayments)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-darkCard text-center border border-slate-200/50 dark:border-darkBorder">
                        <span className="text-[10px] text-slate-400 block">جلسات حضور</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                          {toPersianDigits(totalAttendances)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      💡 با تهیه نسخه پشتیبان، تمام اطلاعات ورزشکاران (پرونده‌ها، تصاویر، تاریخ‌های ثبت‌نام، شماره‌ها، سوابق شهریه و تاریخچه جلسات) در یک فایل ایمن ذخیره می‌شوند.
                    </p>
                  </div>

                  {/* Export Action Buttons */}
                  <div className="space-y-2">
                    {/* 1. Download File */}
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-between active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-5 h-5" />
                        <span className="text-right">دانلود فایل پشتیبان (JSON)</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg">
                        توصیه شده
                      </span>
                    </button>

                    {/* 2. Copy Code */}
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        <span>{copied ? 'کد پشتیبان کپی شد!' : 'کپی متن کد پشتیبان (جهت ذخیره در واتساپ یا نوت)'}</span>
                      </div>
                      <FileText className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 3. Share File */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Share2 className="w-4 h-4 text-slate-400" />
                        <span>اشتراک‌گذاری مستقیم فایل بکاپ</span>
                      </div>
                      <span className="text-[10px] text-slate-400">تلگرام، ایمیل، درایو</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* IMPORT SECTION */
                <div className="space-y-4">
                  {/* Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-500/30 rounded-3xl p-5 text-center cursor-pointer transition-all bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        {isProcessing ? 'در حال خواندن فایل...' : 'انتخاب فایل پشتیبان (.json) از حافظه گوشی'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        روی این کادر ضربه بزنید و فایل قبلی ذخیره شده را انتخاب کنید
                      </span>
                    </div>
                  </div>

                  {/* Manual Text Option */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">
                      یا چسباندن متن کد پشتیبان:
                    </span>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={importedText}
                        onChange={(e) => {
                          setImportedText(e.target.value);
                          setValidatedBackup(null);
                          setValidationError(null);
                        }}
                        placeholder='متن فایل پشتیبان را اینجا Paste کنید (شروع با {"app":"Hirad...")...'
                        className="w-full p-3 text-xs rounded-2xl bg-slate-100 dark:bg-darkSubtle border border-slate-200 dark:border-darkBorder text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-all font-mono"
                        dir="ltr"
                      />
                      {importedText && !validatedBackup && (
                        <button
                          type="button"
                          onClick={handleValidateText}
                          className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold shadow-md hover:bg-emerald-600 transition-all"
                        >
                          بررسی صحت متن
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Validation Error Message */}
                  {validationError && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Validated Backup Summary Card */}
                  {validatedBackup && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>فایل پشتیبان تایید شد و آماده بازیابی است:</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-darkCard/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">تعداد ورزشکاران:</span>
                          <span className="font-black text-brand-600 dark:text-brand-400">
                            {toPersianDigits(validatedBackup.totalAthletes || validatedBackup.athletes.length)} نفر
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-darkCard/70 flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">تاریخ پشتیبان:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {toPersianDigits(validatedBackup.exportDateJalali || 'ثبت شده')}
                          </span>
                        </div>
                      </div>

                      {/* Restore Mode Options */}
                      <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          شیوه اعمال اطلاعات:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRestoreMode('replace')}
                            className={`p-2.5 rounded-xl text-xs font-bold text-right transition-all flex flex-col gap-0.5 border ${
                              restoreMode === 'replace'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : 'bg-white dark:bg-darkCard text-slate-700 dark:text-slate-300 border-slate-200 dark:border-darkBorder'
                            }`}
                          >
                            <span>جایگزینی کامل (توصیه شده)</span>
                            <span className="text-[9px] opacity-80 font-normal">
                              اطلاعات فعلی پاک و عیناً بکاپ اعمال می‌شود
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRestoreMode('merge')}
                            className={`p-2.5 rounded-xl text-xs font-bold text-right transition-all flex flex-col gap-0.5 border ${
                              restoreMode === 'merge'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : 'bg-white dark:bg-darkCard text-slate-700 dark:text-slate-300 border-slate-200 dark:border-darkBorder'
                            }`}
                          >
                            <span>ترکیب و ادغام (Merge)</span>
                            <span className="text-[9px] opacity-80 font-normal">
                              ورزشکاران بکاپ به اعضای فعلی اضافه می‌شوند
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Execute Restore Button */}
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        className="w-full min-h-[46px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        تایید و بازیابی نهایی اطلاعات ({toPersianDigits(validatedBackup.totalAthletes || validatedBackup.athletes.length)} ورزشکار)
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-darkBorder/60 bg-slate-50/50 dark:bg-darkSubtle/30 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 rounded-2xl bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                بستن پنجره
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
