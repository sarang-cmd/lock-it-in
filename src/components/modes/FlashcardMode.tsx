import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shuffle, Check, X, ChevronLeft } from 'lucide-react';
import { StudySet, Term } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { toast } from '../ui/Toast';
import Confetti from '../ui/Confetti';

interface FlashcardModeProps {
  set: StudySet;
  onBack: () => void;
  onComplete?: (results: { termId: string; correct: boolean }[]) => void;
}

export default function FlashcardMode({ set, onBack }: FlashcardModeProps) {
  const [cards, setCards] = useState<Term[]>([...set.terms]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [studyBothSides] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [sessionDone, setSessionDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [knowStreakCount, setKnowStreakCount] = useState(0);

  const current = cards[index];

  // Reset inactivity timer
  const resetInactivity = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    const t = setTimeout(() => {
      toast('yo. you still there?', 'info', 5000);
    }, 5 * 60 * 1000);
    setInactivityTimer(t);
  }, [inactivityTimer]);

  useEffect(() => {
    resetInactivity();
    return () => { if (inactivityTimer) clearTimeout(inactivityTimer); };
  }, [index]);

  useEffect(() => {
    if (index === 2 && !flipped) {
      // subtle moment
    }
  }, [index, flipped]);

  const flip = useCallback(() => {
    setFlipped(f => !f);
    resetInactivity();
  }, [resetInactivity]);

  const navigate = useCallback((dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0 || next >= cards.length) return;
    setIndex(next);
    setFlipped(false);
    resetInactivity();
  }, [index, cards.length, resetInactivity]);

  const markKnown = useCallback(() => {
    setKnown(prev => new Set([...prev, current.id]));
    setUnknown(prev => { const s = new Set(prev); s.delete(current.id); return s; });
    const newStreak = knowStreakCount + 1;
    setKnowStreakCount(newStreak);
    if (newStreak === 10) {
      setConfetti(true);
      toast('locked in streak 🔥', 'success', 4000);
      setTimeout(() => setConfetti(false), 3000);
    }
    if (index === cards.length - 1) {
      setSessionDone(true);
      if (known.size + 1 >= cards.length * 0.8) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 4000);
      }
    } else {
      navigate(1);
    }
  }, [current.id, index, cards.length, known.size, knowStreakCount, navigate]);

  const markUnknown = useCallback(() => {
    setUnknown(prev => new Set([...prev, current.id]));
    setKnown(prev => { const s = new Set(prev); s.delete(current.id); return s; });
    setKnowStreakCount(0);
    if (index === cards.length - 1) {
      setSessionDone(true);
    } else {
      navigate(1);
    }
  }, [current.id, index, cards.length, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (sessionDone) return;
      if (e.key === ' ') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'k' || e.key === 'K') markKnown();
      if (e.key === 'd' || e.key === 'D') markUnknown();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, navigate, markKnown, markUnknown, sessionDone]);

  const toggleShuffle = () => {
    setShuffleOn(s => {
      if (!s) {
        setCards(shuffleArray(set.terms));
      } else {
        setCards([...set.terms]);
      }
      setIndex(0);
      setFlipped(false);
      return !s;
    });
  };

  const restartMissed = () => {
    const missedCards = cards.filter(c => unknown.has(c.id));
    setCards(missedCards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setSessionDone(false);
    setKnowStreakCount(0);
  };

  const restartAll = () => {
    setCards(shuffleArray(set.terms));
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setSessionDone(false);
    setKnowStreakCount(0);
  };

  const knownCount = known.size;
  const unknownCount = unknown.size;
  const pct = cards.length > 0 ? Math.round((knownCount / cards.length) * 100) : 0;

  if (sessionDone) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center"
        style={{ background: '#0A0A14' }}
      >
        <Confetti active={confetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <div className="text-6xl mb-6">{pct >= 80 ? '🔒' : '📚'}</div>
          <h2
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {pct >= 80 ? 'That\'s locked in, fr.' : 'Not bad, son.'}
          </h2>
          <p className="text-base mb-2" style={{ color: '#9CA3AF' }}>
            {pct >= 80 ? 'Run it back?' : 'Lock in the rest.'}
          </p>

          <div
            className="flex items-center justify-center gap-6 my-8 p-6 rounded-2xl"
            style={{ background: '#12121F', border: '1px solid #2D2B55' }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {knownCount}
              </div>
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>know it</div>
            </div>
            <div className="text-3xl" style={{ color: '#2D2B55' }}>|</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {unknownCount}
              </div>
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>still learning</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {unknownCount > 0 && (
              <button
                onClick={restartMissed}
                className="w-full py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'DM Sans, sans-serif' }}
              >
                Study just the ones you missed
              </button>
            )}
            <button
              onClick={restartAll}
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ background: '#12121F', border: '1px solid #2D2B55', color: '#A78BFA', fontFamily: 'DM Sans, sans-serif' }}
            >
              Shuffle and go again
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 text-sm"
              style={{ color: '#4B5563', fontFamily: 'DM Sans, sans-serif' }}
            >
              back to set
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const frontText = studyBothSides && index % 2 === 1 ? current.definition : current.term;
  const backText = studyBothSides && index % 2 === 1 ? current.term : current.definition;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A14' }}>
      <Confetti active={confetti} />

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #2D2B55' }}
      >
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: '#9CA3AF' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <span style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
            {index + 1} / {cards.length}
          </span>
          <button
            onClick={toggleShuffle}
            className="p-2 rounded-xl transition-colors"
            style={{
              color: shuffleOn ? '#A78BFA' : '#4B5563',
              background: shuffleOn ? 'rgba(124,58,237,0.15)' : 'transparent',
            }}
          >
            <Shuffle size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-5" style={{ background: '#2D2B55' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
          animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div
          className="flip-card w-full max-w-2xl"
          style={{ height: 'clamp(280px, 40vh, 400px)' }}
        >
          <div
            className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}
            onClick={flip}
            style={{ cursor: 'pointer' }}
          >
            {/* Front */}
            <div
              className="flip-card-front w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 text-center"
              style={{ background: '#12121F', border: '1px solid #2D2B55' }}
            >
              <div className="text-xs font-medium mb-4" style={{ color: '#4B5563', fontFamily: 'DM Sans, sans-serif' }}>
                {studyBothSides && index % 2 === 1 ? 'DEFINITION' : 'TERM'}
              </div>
              <p
                className="text-2xl font-semibold text-white leading-relaxed"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
              >
                {frontText}
              </p>
              <p className="text-xs mt-6" style={{ color: '#4B5563' }}>tap to flip</p>
            </div>

            {/* Back */}
            <div
              className="flip-card-back w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: '#12121F',
                border: '1px solid #7C3AED',
                boxShadow: '0 0 24px rgba(124,58,237,0.15)',
              }}
            >
              <div className="text-xs font-medium mb-4" style={{ color: '#7C3AED', fontFamily: 'DM Sans, sans-serif' }}>
                {studyBothSides && index % 2 === 1 ? 'TERM' : 'DEFINITION'}
              </div>
              <p
                className="text-2xl font-semibold text-white leading-relaxed"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
              >
                {backText}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={markUnknown}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <X size={16} />
            Don't know
          </motion.button>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              disabled={index === 0}
              className="p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30"
              style={{ color: '#9CA3AF' }}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={index === cards.length - 1}
              className="p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-30"
              style={{ color: '#9CA3AF' }}
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={markKnown}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10B981',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Check size={16} />
            Know it
          </motion.button>
        </div>

        {/* Keyboard hint */}
        <div className="flex gap-6 mt-6 text-xs" style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
          <span>Space = flip</span>
          <span>K = know it</span>
          <span>D = don't know</span>
          <span>← → = navigate</span>
        </div>

        {/* Bottom hint after a while */}
        {index >= 2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-xs mt-4 text-center"
            style={{ color: '#A78BFA' }}
          >
            ok you're built different
          </motion.p>
        )}
      </div>
    </div>
  );
}
