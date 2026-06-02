import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudySet, AppView } from './types';
import { updateStreak, settingsStorage } from './lib/storage';

// Screens
import PreloadScreen from './components/PreloadScreen';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CreateSet from './components/CreateSet';
import SetDetail from './components/modes/SetDetail';
import FlashcardMode from './components/modes/FlashcardMode';
import LearnMode from './components/modes/LearnMode';
import TestMode from './components/modes/TestMode';
import MatchMode from './components/modes/MatchMode';
import ImportSet from './components/ImportSet';
import Settings from './components/Settings';

// UI
import { ToastContainer, ToastMessage, setToastHandler } from './components/ui/Toast';
import { nanoid } from './lib/utils';
import { seedDemoData } from './lib/demo-seed';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>('landing');
  const [activeSet, setActiveSet] = useState<StudySet | null>(null);
  const [editingSet, setEditingSet] = useState<StudySet | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Set up global toast handler
  useEffect(() => {
    setToastHandler((toast) => {
      setToasts(prev => [...prev, { ...toast, id: nanoid(8) }]);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Check onboarding & seed demo data
  useEffect(() => {
    const onboarded = localStorage.getItem('lii_onboarded');
    if (onboarded === 'true') {
      setView('dashboard');
      seedDemoData();
    }
  }, []);

  const handlePreloadComplete = () => {
    setLoading(false);
  };

  const handleGetStarted = async () => {
    localStorage.setItem('lii_onboarded', 'true');
    await seedDemoData();
    setView('dashboard');
  };

  const handleStudySet = (set: StudySet) => {
    setActiveSet(set);
    setView('set-detail');
  };

  const handleMode = (mode: 'flashcard' | 'learn' | 'test' | 'match') => {
    if (!activeSet) return;
    updateStreak(settingsStorage.get());
    setView(mode);
  };

  const handleEditSet = (set: StudySet) => {
    setEditingSet(set);
    setView('create');
  };

  const handleCreateComplete = (set: StudySet) => {
    setEditingSet(null);
    if (activeSet?.id === set.id) {
      setActiveSet(set);
    }
    setView('dashboard');
  };

  const handleImportComplete = (set: StudySet) => {
    setActiveSet(set);
    setView('set-detail');
  };

  const goBack = (target: AppView = 'dashboard') => {
    setView(target);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <>
      {/* Preload Screen */}
      <AnimatePresence>
        {loading && (
          <PreloadScreen onComplete={handlePreloadComplete} />
        )}
      </AnimatePresence>

      {/* Main App */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {view === 'landing' && (
              <LandingPage onGetStarted={handleGetStarted} />
            )}

            {view === 'dashboard' && (
              <Dashboard
                onCreateSet={() => { setEditingSet(null); setView('create'); }}
                onStudySet={handleStudySet}
                onEditSet={handleEditSet}
                onImport={() => setView('import')}
                onSettings={() => setView('settings')}
              />
            )}

            {view === 'create' && (
              <CreateSet
                existingSet={editingSet}
                onComplete={handleCreateComplete}
                onCancel={() => setView(activeSet && editingSet ? 'set-detail' : 'dashboard')}
              />
            )}

            {view === 'set-detail' && activeSet && (
              <SetDetail
                set={activeSet}
                onBack={() => goBack('dashboard')}
                onMode={handleMode}
                onEdit={() => { setEditingSet(activeSet); setView('create'); }}
              />
            )}

            {view === 'flashcard' && activeSet && (
              <FlashcardMode
                set={activeSet}
                onBack={() => goBack('set-detail')}
              />
            )}

            {view === 'learn' && activeSet && (
              <LearnMode
                set={activeSet}
                onBack={() => goBack('set-detail')}
              />
            )}

            {view === 'test' && activeSet && (
              <TestMode
                set={activeSet}
                onBack={() => goBack('set-detail')}
              />
            )}

            {view === 'match' && activeSet && (
              <MatchMode
                set={activeSet}
                onBack={() => goBack('set-detail')}
              />
            )}

            {view === 'import' && (
              <ImportSet
                onComplete={handleImportComplete}
                onCancel={() => setView('dashboard')}
              />
            )}

            {view === 'settings' && (
              <Settings onBack={() => setView('dashboard')} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
