import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Settings, Import, X, Flame, BookOpen, Star } from 'lucide-react';
import { StudySet, AppSettings } from '../types';
import { db, settingsStorage } from '../lib/storage';
import { getTimeGreeting, downloadFile } from '../lib/utils';
import SetCard from './SetCard';
import TextGlitch from './ui/TextGlitch';
import BlurText from './ui/BlurText';
import { toast } from './ui/Toast';

interface DashboardProps {
  onCreateSet: () => void;
  onStudySet: (set: StudySet) => void;
  onEditSet: (set: StudySet) => void;
  onImport: () => void;
  onSettings: () => void;
}

export default function Dashboard({ onCreateSet, onStudySet, onEditSet, onImport, onSettings }: DashboardProps) {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.get());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const loadSets = useCallback(async () => {
    const allSets = await db.sets.getAll();
    setSets(allSets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    setSettings(settingsStorage.get());
  }, []);

  useEffect(() => { loadSets(); }, [loadSets]);

  const handleDelete = async (id: string) => {
    const set = sets.find(s => s.id === id);
    if (!set) return;
    if (!confirm(`delete "${set.name}"? can't undo this.`)) return;
    await db.sets.delete(id);
    setSets(prev => prev.filter(s => s.id !== id));
    toast('deleted 🗑️', 'info');
  };

  const handleExport = async (id: string) => {
    try {
      const json = await db.export.toJSON(id);
      const set = sets.find(s => s.id === id);
      const filename = `lock-it-in_${(set?.name || 'set').replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename);
      toast('saved 🔒', 'success');
    } catch {
      toast('something broke. try again.', 'error');
    }
  };

  // Computed
  const allTags = [...new Set(sets.flatMap(s => s.tags))];
  const totalMastered = sets.reduce((sum, s) =>
    sum + s.terms.filter(t => t.masteryScore === 4).length, 0);

  const filteredSets = sets.filter(s => {
    const matchesSearch = !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || s.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const isEmpty = sets.length === 0;
  const streak = settings.streakData.currentStreak;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A14' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(10,10,20,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2D2B55',
        }}
      >
        <div
          className="font-black text-white text-xl"
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}
        >
          <TextGlitch text="LOCK IT IN" />
          <span style={{ color: '#7C3AED' }}>!</span>
        </div>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="search sets..."
                className="w-full px-3 py-1.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none input-glow"
                style={{
                  background: '#12121F',
                  border: '1px solid #2D2B55',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              <Search size={18} />
            </button>
          )}
          <button
            onClick={onSettings}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 pb-32 max-w-4xl mx-auto w-full">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <p className="text-sm mb-1" style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}>
            {getTimeGreeting()}
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}
          >
            your sets
          </h1>
        </motion.div>

        {/* Stats strip */}
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: 'sets', value: sets.length, icon: BookOpen },
              { label: 'terms locked', value: totalMastered, icon: Star },
              { label: 'day streak', value: streak, icon: Flame },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 p-4 rounded-2xl"
                style={{ background: '#12121F', border: '1px solid #2D2B55' }}
              >
                <stat.icon size={16} className="text-violet-400 mb-1" />
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {stat.value}
                </span>
                <span className="text-xs" style={{ color: '#4B5563', fontFamily: 'DM Sans, sans-serif' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(null)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: !selectedTag ? '#7C3AED' : 'rgba(124,58,237,0.1)',
                color: !selectedTag ? 'white' : '#A78BFA',
                border: `1px solid ${!selectedTag ? '#7C3AED' : 'rgba(124,58,237,0.3)'}`,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              all
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: selectedTag === tag ? '#7C3AED' : 'rgba(124,58,237,0.1)',
                  color: selectedTag === tag ? 'white' : '#A78BFA',
                  border: `1px solid ${selectedTag === tag ? '#7C3AED' : 'rgba(124,58,237,0.3)'}`,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Set grid */}
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-6xl mb-6">🔒</div>
            <p className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
              <BlurText text="No sets yet." delay={0} />
            </p>
            <p className="text-base mb-8" style={{ color: '#9CA3AF' }}>
              <BlurText text="Lock something in." delay={300} wordDelay={100} />
            </p>
            <button
              onClick={onCreateSet}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
            >
              <Plus size={18} />
              create your first set
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSets.map(set => (
                <SetCard
                  key={set.id}
                  set={set}
                  onStudy={onStudySet}
                  onEdit={onEditSet}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.05 }}
                onClick={() => { setFabOpen(false); onImport(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg"
                style={{ background: '#1A1A2E', border: '1px solid #2D2B55', fontFamily: 'DM Sans, sans-serif' }}
              >
                <Import size={16} className="text-violet-400" />
                Import a Set
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => { setFabOpen(false); onCreateSet(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg"
                style={{ background: '#1A1A2E', border: '1px solid #2D2B55', fontFamily: 'DM Sans, sans-serif' }}
              >
                <Plus size={16} className="text-violet-400" />
                Create a Set
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            boxShadow: '0 0 30px rgba(124,58,237,0.5)',
          }}
        >
          <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={24} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
