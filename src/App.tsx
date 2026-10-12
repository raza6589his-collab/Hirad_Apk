import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Athlete, AttendanceRecord } from './types/athlete';
import {
  getStoredAthletes,
  saveStoredAthletes,
  getStoredBackground,
  saveStoredBackground,
  AppBackgroundConfig,
  PRESET_BACKGROUNDS,
} from './utils/storage';
import { AthleteList } from './components/AthleteList';
import { AthleteProfile } from './components/AthleteProfile';
import { RegistrationModal } from './components/RegistrationModal';
import { QuickAttendanceModal } from './components/QuickAttendanceModal';
import { UpdateNotificationModal } from './components/UpdateNotificationModal';
import { BackgroundModal } from './components/BackgroundModal';
import { BackupModal } from './components/BackupModal';
import { Toast, ToastMessage } from './components/Toast';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isUpdateNotificationOpen, setIsUpdateNotificationOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [backgroundConfig, setBackgroundConfig] = useState<AppBackgroundConfig>(getStoredBackground());
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Load athletes and background from local storage on mount
  useEffect(() => {
    const data = getStoredAthletes();
    setAthletes(data);
    setBackgroundConfig(getStoredBackground());

    // Show new version v1.4.0 update notification to users
    const hasSeenUpdate = sessionStorage.getItem('hirad_seen_v1_4_update');
    if (!hasSeenUpdate) {
      const timer = setTimeout(() => {
        setIsUpdateNotificationOpen(true);
        sessionStorage.setItem('hirad_seen_v1_4_update', 'true');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync to storage whenever athletes change
  const updateAthletes = (newList: Athlete[]) => {
    setAthletes(newList);
    saveStoredAthletes(newList);
  };

  // Currently selected athlete for profile view
  const currentAthlete = athletes.find((a) => a.id === selectedAthleteId) || null;

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      message,
    });
  };

  const handleSaveAthlete = async (
    athleteData: Omit<Athlete, 'id' | 'lastUpdated'>,
    id?: string
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (id) {
      // Edit existing - preserve past payments & attendance history!
      const updatedList = athletes.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            ...athleteData,
            payments: a.payments || [],
            attendances: a.attendances || [],
            lastUpdated: new Date().toISOString(),
          };
        }
        return a;
      });
      updateAthletes(updatedList);
      showToast('success', 'اطلاعات پرونده ورزشکار با موفقیت به‌روزرسانی شد');
    } else {
      // Add new athlete
      const newId = `ath-${Date.now()}`;
      const initialPayments = athleteData.tuitionPaid > 0 ? [
        {
          id: `pay-${Date.now()}`,
          date: athleteData.registrationDate,
          amount: athleteData.tuitionPaid,
          type: 'payment' as const,
          title: 'پرداخت اولیه هنگام ثبت‌نام',
        }
      ] : [];

      const newRecord: Athlete = {
        ...athleteData,
        id: newId,
        payments: initialPayments,
        attendances: [],
        lastUpdated: new Date().toISOString(),
      };
      const updatedList = [newRecord, ...athletes];
      updateAthletes(updatedList);
      setNewlyAddedId(newId);

      // Celebratory confetti for new member!
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.8 },
          colors: ['#f97316', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {
        // Safe fallback
      }

      showToast('success', 'ورزشکار جدید با موفقیت در باشگاه هیراد ثبت شد');

      setTimeout(() => {
        setNewlyAddedId(null);
      }, 1200);
    }
  };

  // Instant attendance registration via national code
  const handleRecordAttendance = (athleteId: string, attendance: AttendanceRecord) => {
    const updatedList = athletes.map((a) => {
      if (a.id === athleteId) {
        return {
          ...a,
          attendances: [attendance, ...(a.attendances || [])],
          lastUpdated: new Date().toISOString(),
        };
      }
      return a;
    });
    updateAthletes(updatedList);

    const ath = athletes.find((a) => a.id === athleteId);
    showToast(
      'success',
      `حضور ${ath ? `${ath.firstName} ${ath.lastName}` : 'ورزشکار'} برای جلسه شماره ${attendance.sessionNumber} ثبت گردید ✅`
    );
  };

  const handleUndoAttendance = (athleteId: string, attendanceId: string) => {
    const updatedList = athletes.map((a) => {
      if (a.id === athleteId) {
        return {
          ...a,
          attendances: (a.attendances || []).filter((att) => att.id !== attendanceId),
          lastUpdated: new Date().toISOString(),
        };
      }
      return a;
    });
    updateAthletes(updatedList);
    showToast('info', 'ثبت حضور با موفقیت لغو شد ↩️');
  };

  const handleUpdateSingleAthlete = (updated: Athlete) => {
    const updatedList = athletes.map((a) => (a.id === updated.id ? updated : a));
    updateAthletes(updatedList);
  };

  const handleDeleteAthlete = (athlete: Athlete) => {
    const updatedList = athletes.filter((a) => a.id !== athlete.id);
    updateAthletes(updatedList);
    if (selectedAthleteId === athlete.id) {
      setSelectedAthleteId(null);
    }
    showToast('info', `پرونده ${athlete.firstName} ${athlete.lastName} با موفقیت حذف گردید`);
  };

  const handleRefresh = async () => {
    const refreshed = getStoredAthletes();
    setAthletes(refreshed);
    showToast('info', 'لیست ورزشکاران به‌روزرسانی شد');
  };

  const activePreset =
    backgroundConfig.type === 'preset'
      ? PRESET_BACKGROUNDS.find((p) => p.id === backgroundConfig.presetId)
      : null;

  const backgroundStyle: React.CSSProperties = {};
  if (backgroundConfig.type === 'preset' && activePreset) {
    backgroundStyle.background = activePreset.style;
  } else if (backgroundConfig.type === 'custom' && backgroundConfig.customDataUrl) {
    backgroundStyle.backgroundImage = `url("${backgroundConfig.customDataUrl}")`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
    backgroundStyle.backgroundRepeat = 'no-repeat';
  }

  return (
    <div
      className="min-h-screen bg-slate-950 flex justify-center items-center font-vazir antialiased selection:bg-brand-500 selection:text-white"
      dir="rtl"
    >
      {/* Mobile Frame Container: native on mobile phone, elegantly framed on desktop */}
      <main className="w-full h-screen sm:h-[94vh] sm:max-w-md sm:rounded-[40px] sm:shadow-2xl overflow-hidden relative flex flex-col bg-white dark:bg-darkBg sm:border-8 sm:border-slate-800 transition-colors">
        {/* Dynamic Custom/Preset Background Layer */}
        {backgroundConfig.type !== 'default' && (
          <div
            className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
            style={backgroundStyle}
          >
            <div
              className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
              style={{ opacity: backgroundConfig.overlayOpacity }}
            />
          </div>
        )}

        <AnimatePresence initial={false}>
          {currentAthlete ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="h-full flex flex-col absolute inset-0 z-20 bg-white/95 dark:bg-darkBg/90 backdrop-blur-sm"
            >
              <AthleteProfile
                athlete={currentAthlete}
                onBack={() => setSelectedAthleteId(null)}
                onEdit={(ath) => {
                  setEditingAthlete(ath);
                  setIsRegistrationOpen(true);
                }}
                onDelete={handleDeleteAthlete}
                onUpdate={handleUpdateSingleAthlete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="h-full flex flex-col absolute inset-0 z-10 bg-white/95 dark:bg-darkBg/90 backdrop-blur-sm"
            >
              <AthleteList
                athletes={athletes}
                onSelectAthlete={(ath) => setSelectedAthleteId(ath.id)}
                onOpenAddModal={() => {
                  setEditingAthlete(null);
                  setIsRegistrationOpen(true);
                }}
                onDeleteAthlete={handleDeleteAthlete}
                onOpenAttendance={() => setIsAttendanceOpen(true)}
                onOpenUpdates={() => setIsUpdateNotificationOpen(true)}
                onOpenBackup={() => setIsBackupOpen(true)}
                onOpenBackground={() => setIsBackgroundOpen(true)}
                newlyAddedId={newlyAddedId}
                onRefresh={handleRefresh}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen 1 Registration / Edit Form Sheet */}
        <RegistrationModal
          isOpen={isRegistrationOpen}
          onClose={() => {
            setIsRegistrationOpen(false);
            setEditingAthlete(null);
          }}
          onSave={handleSaveAthlete}
          editAthlete={editingAthlete}
        />

        {/* Quick Attendance Check-in Modal (National ID lookup) */}
        <QuickAttendanceModal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          athletes={athletes}
          onRecordAttendance={handleRecordAttendance}
          onUndoAttendance={handleUndoAttendance}
          onRegisterNewAthlete={(prefilledNatId) => {
            setEditingAthlete(prefilledNatId ? ({ nationalId: prefilledNatId } as any) : null);
            setIsAttendanceOpen(false);
            setIsRegistrationOpen(true);
          }}
        />

        {/* Background Customizer Modal */}
        <BackgroundModal
          isOpen={isBackgroundOpen}
          onClose={() => setIsBackgroundOpen(false)}
          currentConfig={backgroundConfig}
          onSaveConfig={(newConfig) => {
            setBackgroundConfig(newConfig);
            saveStoredBackground(newConfig);
            showToast('success', 'پس‌زمینه اختصاصی باشگاه با موفقیت تنظیم و ذخیره شد');
          }}
        />

        {/* Backup & Recovery Modal */}
        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          athletes={athletes}
          onAthletesRestored={(restoredList) => {
            setAthletes(restoredList);
            setBackgroundConfig(getStoredBackground());
          }}
          onShowToast={showToast}
        />

        {/* In-App New Version Update Notification Modal */}
        <UpdateNotificationModal
          isOpen={isUpdateNotificationOpen}
          onClose={() => setIsUpdateNotificationOpen(false)}
          currentVersion="1.3.0"
          newVersion="1.4.0"
        />

        {/* Global Toast Messages */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </main>
    </div>
  );
};

export default App;
