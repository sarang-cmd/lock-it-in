import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Brain, ClipboardList, Zap, Download, Edit3, Tag } from 'lucide-react';
import { StudySet } from '../../types';
import { getMasteryPercent, downloadFile } from '../../lib/utils';
import { db } from '../../lib/storage';
import ProgressRing from '../ui/ProgressRing';
import TextGlitch from '../ui/TextGlitch';
import { toast } from '../ui/Toast';

interface SetDetailProps {
  set: StudySet;
  onBack: () => void;
  onMode: (mode: 'flashcard' | 'learn' | 'test' | 'match') => void;
  onEdit: () => void;
}

const modes = [
  {
    id: 'flashcard' as const,
    icon: BookOpen,
    label: 'Flashcards',
    desc: 'flip, know it, move on',
    color: '#7C3AED',
    glow: 'rgba(124,58,237,0.3)',
  },
  {
    id: 'learn' as const,
    icon: Brain,
    label: 'Learn',
    desc: 'adaptive mastery, no cap',
    color: '#4F46E5',
    glow: 'rgba(79,70,229,0.3)',
  },
  {
    id: 'test' as const,
    icon: ClipboardList,
    label: 'Test',
    desc: 'graded, real talk',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    id: 'match' as const,
    icon: Zap,
    label: 'Match',
    desc: 'race the clock fr',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.3)',
  },
];

export default function SetDetail({ set, onBack, onMode, onEdit }: SetDetailProps) {
  const mastery = getMasteryPercent(set.terms);

  const handleExport = async () => {
    try {
      const json = await db.export.toJSON(set.id);
      const filename = `lock-it-in_${set.name.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename);
      toast('saved 🔒', 'success');
    } catch {
      toast('something broke. try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A14' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(10,10,20,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2D2B55',
        }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
          style={{ color: '#9CA3AF' }}
        >
          <ArrowLeft size={18} />
          back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Set header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1
                className="text-3xl font-black text-white mb-2"
                style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}
              >
                <TextGlitch text={set.name} autoPlay />
              </h1>
              <div
                className="text-sm"
                style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {set.terms.length} terms
              </div>
            </div>
            <ProgressRing percent={mastery} size={64} strokeWidth={5} />
          </div>

          {set.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              <Tag size={12} style={{ color: '#4B5563' }} />
              {set.tags.map(tag => (
                <span key={tag} className="tag-chip">#{tag}</span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, boxShadow: `0 0 30px ${mode.glow}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onMode(mode.id)}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all"
              style={{
                background: '#12121F',
                border: `1px solid ${mode.color}30`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${mode.color}20` }}
              >
                <mode.icon size={20} style={{ color: mode.color }} />
              </div>
              <div>
                <div className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {mode.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  {mode.desc}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Terms preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}
          >
            terms in this set
          </h2>
          <div className="space-y-2">
            {set.terms.map((term) => (
              <div
                key={term.id}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: '#12121F', border: '1px solid #2D2B55' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {term.term}
                  </div>
                  <div className="text-sm" style={{ color: '#9CA3AF' }}>
                    {term.definition}
                  </div>
                </div>
                <div className="shrink-0">
                  {[0, 1, 2, 3, 4].map(n => (
                    <div
                      key={n}
                      className="inline-block w-2 h-2 rounded-full mr-0.5"
                      style={{
                        background: n < term.masteryScore ? '#7C3AED' : '#2D2B55',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
