import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Athlete } from './types/athlete';
import { getStoredAthletes, saveStoredAthletes } from './utils/storage';
import { AthleteList } from './components/AthleteList';
import { AthleteProfile } from './components/AthleteProfile';
import { RegistrationModal } from './components/RegistrationModal';
import { Toast, ToastMessage } from './components/Toast';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Load athletes from local storage on mount
  useEffect(() => {
    const data = getStoredAthletes();
    setAthletes(data);
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
      // Edit existing
      const updatedList = athletes.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            ...athleteData,
            lastUpdated: new Date().toISOString(),
          };
        }
        return a;
      });
      updateAthletes(updatedList);
      showToast('success', 'اطلاعات ورزشکار با موفقیت به‌روزرسانی شد');
    } else {
      // Add new athlete
      const newId = `ath-${Date.now()}`;
      const newRecord: Athlete = {
        ...athleteData,
        id: newId,
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

      showToast('success', 'ورزشکار جدید با موفقیت ثبت شد');

      // Clear highlight after animation completes
      setTimeout(() => {
        setNewlyAddedId(null);
      }, 1200);
    }
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

  return (
    <div
      className="min-h-screen bg-slate-950 flex justify-center items-center font-vazir antialiased selection:bg-brand-500 selection:text-white"
      dir="rtl"
    >
      {/* Mobile Frame Container: native on mobile phone, elegantly framed on desktop */}
      <main className="w-full h-screen sm:h-[94vh] sm:max-w-md sm:rounded-[40px] sm:shadow-2xl overflow-hidden relative flex flex-col bg-white dark:bg-darkBg sm:border-8 sm:border-slate-800 transition-colors">
        <AnimatePresence initial={false}>
          {currentAthlete ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="h-full flex flex-col absolute inset-0 z-20 bg-white dark:bg-darkBg"
            >
              <AthleteProfile
                athlete={currentAthlete}
                onBack={() => setSelectedAthleteId(null)}
                onEdit={(ath) => {
                  setEditingAthlete(ath);
                  setIsRegistrationOpen(true);
                }}
                onDelete={handleDeleteAthlete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="h-full flex flex-col absolute inset-0 z-10 bg-white dark:bg-darkBg"
            >
              <AthleteList
                athletes={athletes}
                onSelectAthlete={(ath) => setSelectedAthleteId(ath.id)}
                onOpenAddModal={() => {
                  setEditingAthlete(null);
                  setIsRegistrationOpen(true);
                }}
                onDeleteAthlete={handleDeleteAthlete}
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

        {/* Global Toast Messages */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </main>
    </div>
  );
};

export default App;
