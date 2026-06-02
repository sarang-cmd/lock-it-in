import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Edit3, Download, Play, BookOpen, Clock } from 'lucide-react';
import { StudySet } from '../types';
import { getMasteryPercent, formatRelativeTime } from '../lib/utils';
import ProgressRing from './ui/ProgressRing';
import TextGlitch from './ui/TextGlitch';

interface SetCardProps {
  set: StudySet;
  onStudy: (set: StudySet) => void;
  onEdit: (set: StudySet) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export default function SetCard({ set, onStudy, onEdit, onDelete, onExport }: SetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mastery = getMasteryPercent(set.terms);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl p-5 cursor-pointer card-glow transition-all group"
      style={{
        background: '#12121F',
        border: '1px solid #2D2B55',
      }}
      onClick={() => onStudy(set)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3
            className="font-semibold text-base text-white truncate mb-1"
            style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}
          >
            <TextGlitch text={set.name} />
          </h3>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="flex items-center gap-1">
              <BookOpen size={10} />
              {set.terms.length} terms
            </span>
            {set.lastStudied && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatRelativeTime(set.lastStudied)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProgressRing percent={mastery} size={40} strokeWidth={3} label={false} />
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#4B5563' }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {set.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {set.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-chip">#{tag}</span>
          ))}
          {set.tags.length > 3 && (
            <span className="tag-chip">+{set.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Mastery bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
            mastery
          </span>
          <span className="text-xs font-medium" style={{ color: '#A78BFA', fontFamily: 'JetBrains Mono, monospace' }}>
            {mastery}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2D2B55' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              className="absolute right-4 top-10 z-50 rounded-xl overflow-hidden shadow-xl py-1"
              style={{ background: '#1A1A2E', border: '1px solid #2D2B55', minWidth: 160 }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { icon: Play, label: 'Study', action: () => { onStudy(set); setMenuOpen(false); } },
                { icon: Edit3, label: 'Edit', action: () => { onEdit(set); setMenuOpen(false); } },
                { icon: Download, label: 'Export', action: () => { onExport(set.id); setMenuOpen(false); } },
                { icon: Trash2, label: 'Delete', action: () => { onDelete(set.id); setMenuOpen(false); }, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{
                    color: item.danger ? '#EF4444' : '#F1F0FF',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
