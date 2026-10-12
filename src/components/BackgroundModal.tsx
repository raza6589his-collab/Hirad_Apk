import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  X,
  Sliders,
  Sparkles,
  Eye,
} from 'lucide-react';
import {
  AppBackgroundConfig,
  PRESET_BACKGROUNDS,
  DEFAULT_BACKGROUND_CONFIG,
} from '../utils/storage';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AppBackgroundConfig;
  onSaveConfig: (config: AppBackgroundConfig) => void;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<AppBackgroundConfig>(currentConfig);
  const [previewTab, setPreviewTab] = useState<'presets' | 'custom'>('presets');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
      setPreviewTab(currentConfig.type === 'custom' ? 'custom' : 'presets');
    }
  }, [isOpen, currentConfig]);

  const handleSelectPreset = (presetId: string) => {
    setConfig((prev) => ({
      ...prev,
      type: 'preset',
      presetId,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image via hidden canvas to max 1280px dimension to prevent localStorage quota issues
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setConfig((prev) => ({
            ...prev,
            type: 'custom',
            customDataUrl: dataUrl,
          }));
          setPreviewTab('custom');
        }
        setIsProcessingImg(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_BACKGROUND_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(config);
    onClose();
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
            className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl shadow-2xl border border-slate-200 dark:border-darkBorder overflow-hidden flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-darkBorder/60 flex items-center justify-between bg-slate-50/50 dark:bg-darkSubtle/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    شخصی‌سازی پس‌زمینه باشگاه
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    انتخاب از گالری گوشی یا پس‌زمینه‌های آماده
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

            {/* Tab Buttons */}
            <div className="grid grid-cols-2 p-2 mx-4 mt-3 bg-slate-100 dark:bg-darkSubtle rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setPreviewTab('presets')}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === 'presets'
                    ? 'bg-white dark:bg-darkCard text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                پس‌زمینه‌های آماده ({PRESET_BACKGROUNDS.length})
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('custom')}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === 'custom'
                    ? 'bg-white dark:bg-darkCard text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                عکس دلخواه از گالری
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {previewTab === 'presets' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {PRESET_BACKGROUNDS.map((preset) => {
                      const isSelected = config.type === 'preset' && config.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`relative text-right p-3 rounded-2xl border transition-all flex flex-col gap-2 min-h-[90px] overflow-hidden group ${
                            isSelected
                              ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5'
                              : 'border-slate-200 dark:border-darkBorder hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-darkSubtle'
                          }`}
                        >
                          <div
                            className="w-full h-11 rounded-xl border border-white/10 shadow-inner relative overflow-hidden"
                            style={{ background: preset.preview }}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] text-slate-400 line-clamp-1 block">
                              {preset.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gallery Image Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-brand-500/40 hover:border-brand-500 dark:border-brand-500/30 rounded-3xl p-6 text-center cursor-pointer transition-all bg-brand-500/5 hover:bg-brand-500/10 flex flex-col items-center justify-center gap-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        {isProcessingImg ? 'در حال پردازش تصویر...' : 'انتخاب عکس از گالری گوشی یا سیستم'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        فرمت‌های JPG، PNG، WEBP (به‌صورت بهینه‌شده ذخیره می‌شود)
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Image Preview */}
                  {config.customDataUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-darkBorder h-36 bg-slate-900 shadow-md">
                      <img
                        src={config.customDataUrl}
                        alt="پیش‌نمایش پس‌زمینه"
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-black pointer-events-none"
                        style={{ opacity: config.overlayOpacity }}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        عکس انتخاب شده از گالری
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="absolute bottom-2 left-2 bg-white/90 dark:bg-darkCard/90 hover:bg-white text-slate-800 dark:text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        تغییر عکس
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Opacity / Darkening Filter Slider (Keeps Text Readable!) */}
              {(config.type === 'custom' || config.type === 'preset') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-darkSubtle border border-slate-200/70 dark:border-darkBorder space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-500" />
                      شدت تیرگی و وضوح متن‌ها
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-mono">
                      {Math.round(config.overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.85"
                    step="0.05"
                    value={config.overlayOpacity}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        overlayOpacity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-brand-500 h-1.5 bg-slate-200 dark:bg-darkBorder rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    جهت خوانایی کامل اطلاعات و شهریه‌ها، لایه تیرگی شفاف روی پس‌زمینه اعمال می‌شود.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-darkBorder/60 bg-slate-50/50 dark:bg-darkSubtle/30 flex gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="min-h-[44px] px-3 rounded-2xl bg-slate-100 dark:bg-darkSubtle hover:bg-slate-200 dark:hover:bg-darkBorder text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="بازگشت به پس‌زمینه پیش‌فرض"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                پیش‌فرض
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 min-h-[44px] rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                اعمال و ذخیره پس‌زمینه
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
