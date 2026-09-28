import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Download,
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  UserCheck,
  Camera,
  Smartphone,
  ChevronLeft,
} from 'lucide-react';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
  newVersion?: string;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  currentVersion = '1.2.0',
  newVersion = '1.3.0',
}) => {
  const releaseUrl = 'https://github.com/raza6589his-collab/Hirad_Apk/releases/latest';

  const features = [
    {
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      title: 'یکپارچه‌سازی ارقام فارسی در سراسر اپلیکیشن',
      desc: 'نمایش هماهنگ تمام تاریخ‌ها، مبالغ، کدهای ملی، شماره‌های تماس و شمارنده‌ها با اعداد اصیل فارسی (۰۱۲۳۴۵۶۷۸۹).',
    },
    {
      icon: <Smartphone className="w-4 h-4 text-blue-500" />,
      title: 'طراحی استاندارد هدر با حداکثر ۴ دکمه لمسی',
      desc: 'دکمه‌های با ابعاد مناسب ۴۴ پیکسلی و دسترسی مستقیم به حالت شب/روز، به همراه انتقال گزینه‌ها به منوی کشویی.',
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 text-teal-500" />,
      title: 'ثبت هوشمند حضور و غیاب با قابلیت لغو (Undo)',
      desc: 'ثبت خودکار بلافاصله پس از درج ۱۰ رقم کد ملی، نمایش تایمر ۵ ثانیه‌ای لغو، و هشدار عدم ثبت تکراری در همان روز.',
    },
    {
      icon: <UserCheck className="w-4 h-4 text-brand-500" />,
      title: 'اعتبارسنجی دقیق الگوریتم کد ملی ۱۰ رقمی',
      desc: 'محاسبه رسمی فرمول ده رقمی کد ملی ایران با پیام راهنما و عدم پذیرش کدهای غیرمعتبر.',
    },
    {
      icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
      title: 'قالب‌بندی دقیق مبالغ و تفکیک دکمه‌های مالی',
      desc: 'جداسازی سه‌رقمی مبالغ، ایجاد دکمه‌های اختصاصی برای ثبت واریزی و شهریه ماه جدید، و آیکون رسمی واتساپ و تماس.',
    },
    {
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      title: 'تقویم جلالی پویا و انتخاب سریع سال‌ها و تاریخ',
      desc: 'محاسبات پویا بر مبنای تاریخ روز، انتخاب سریع دیروز و امروز، و پرش آسان به دهه‌های مختلف جهت انتخاب تاریخ تولد.',
    },
  ];

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
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-lg bg-white dark:bg-darkCard rounded-3xl shadow-2xl border border-brand-500/30 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            {/* Header Banner */}
            <div className="relative bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 p-6 text-white overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-sm text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                    نسخه جدید آماده نصب است
                  </span>
                  <h2 className="text-xl font-black tracking-tight mt-2">
                    اپلیکیشن باشگاه هیراد نسخه {newVersion}
                  </h2>
                  <p className="text-xs text-white/90 font-medium">
                    نسخه فعلی شما: {currentVersion} • ارتقاء به نسخه {newVersion}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Change Log / Features List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                تغییرات و قابلیت‌های جدید اضافه شده به برنامه:
              </p>

              <div className="space-y-2.5">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-darkSubtle/60 border border-slate-200/80 dark:border-darkBorder flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-darkCard shadow-sm flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-darkBorder">
                      {feat.icon}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Direct Download Button */}
            <div className="p-4 border-t border-slate-100 dark:border-darkBorder/60 bg-slate-50/70 dark:bg-darkSubtle/40 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-darkBorder transition-colors"
              >
                بعداً یادآوری کن
              </button>
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-black text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>دریافت نسخه جدید (دانلود APK)</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
