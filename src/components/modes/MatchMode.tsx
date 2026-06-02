import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Timer } from 'lucide-react';
import { StudySet, Term } from '../../types';
import { shuffleArray } from '../../lib/utils';

interface MatchModeProps {
  set: StudySet;
  onBack: () => void;
}

type CardType = 'term' | 'definition';

interface MatchCard {
  id: string;
  termId: string;
  text: string;
  type: CardType;
  matched: boolean;
  selected: boolean;
  wrong: boolean;
}

const BATCH_SIZE = 6;

function buildCards(terms: Term[]): MatchCard[] {
  const cards: MatchCard[] = [];
  for (const term of terms) {
    cards.push({
      id: `term-${term.id}`,
      termId: term.id,
      text: term.term,
      type: 'term',
      matched: false,
      selected: false,
      wrong: false,
    });
    cards.push({
      id: `def-${term.id}`,
      termId: term.id,
      text: term.definition,
      type: 'definition',
      matched: false,
      selected: false,
      wrong: false,
    });
  }
  return shuffleArray(cards);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export default function MatchMode({ set, onBack }: MatchModeProps) {
  const [cards, setCards] = useState<MatchCard[]>(() => buildCards(shuffleArray(set.terms).slice(0, BATCH_SIZE / 2)));
  const [selected, setSelected] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [personalBest, setPersonalBest] = useState<number | null>(() => {
    const stored = localStorage.getItem(`lii_match_pb_${set.id}`);
    return stored ? Number(stored) : null;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 50);
    setRunning(true);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const handleCardClick = useCallback((cardId: string) => {
    if (!running) startTimer();

    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card || card.matched) return prev;

      if (selected === null) {
        // First selection
        setSelected(cardId);
        return prev.map(c => c.id === cardId ? { ...c, selected: true } : c);
      }

      if (selected === cardId) {
        // Deselect
        setSelected(null);
        return prev.map(c => c.id === cardId ? { ...c, selected: false } : c);
      }

      // Second selection — check match
      const firstCard = prev.find(c => c.id === selected);
      if (!firstCard || firstCard.type === card.type) {
        // Same type — swap selection
        setSelected(cardId);
        return prev.map(c => {
          if (c.id === selected) return { ...c, selected: false };
          if (c.id === cardId) return { ...c, selected: true };
          return c;
        });
      }

      const isMatch = firstCard.termId === card.termId;

      if (isMatch) {
        setSelected(null);
        const newCards = prev.map(c => {
          if (c.id === selected || c.id === cardId) {
            return { ...c, selected: false, matched: true };
          }
          return c;
        });

        // Check if all matched
        if (newCards.every(c => c.matched)) {
          stopTimer();
          setDone(true);
          const finalTime = Date.now() - startTimeRef.current;
          if (!personalBest || finalTime < personalBest) {
            setPersonalBest(finalTime);
            localStorage.setItem(`lii_match_pb_${set.id}`, String(finalTime));
          }
        }

        return newCards;
      } else {
        // Wrong match — shake then deselect
        setSelected(null);
        const shaking = prev.map(c => {
          if (c.id === selected || c.id === cardId) {
            return { ...c, selected: false, wrong: true };
          }
          return c;
        });
        setTimeout(() => {
          setCards(current => current.map(c => ({ ...c, wrong: false })));
        }, 500);
        return shaking;
      }
    });
  }, [selected, running, personalBest, set.id]);

  const restart = () => {
    setCards(buildCards(shuffleArray(set.terms).slice(0, BATCH_SIZE / 2)));
    setSelected(null);
    setElapsed(0);
    setRunning(false);
    setDone(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const isNewPB = done && personalBest && elapsed <= personalBest;

  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: '#0A0A14' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <div className="text-6xl mb-6">{isNewPB ? '🎯' : '⏱️'}</div>
          {isNewPB && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-bold mb-2"
              style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}
            >
              NEW PB 🎯
            </motion.div>
          )}
          <div
            className="text-5xl font-black text-white mb-2"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatTime(elapsed)}
          </div>
          <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
            that's a time. lock it in.
          </p>
          {personalBest && !isNewPB && (
            <p className="text-xs mb-6" style={{ color: '#4B5563' }}>
              pb: {formatTime(personalBest)}
            </p>
          )}
          {elapsed > 5 * 60 * 1000 && (
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              it's giving slow but at least you finished
            </p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={restart}
              className="w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'DM Sans, sans-serif' }}
            >
              play again
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 text-sm"
              style={{ color: '#4B5563' }}
            >
              back to set
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A14' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #2D2B55' }}
      >
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#9CA3AF' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Timer size={14} style={{ color: '#A78BFA' }} />
          <span
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'JetBrains Mono, monospace', minWidth: 80, textAlign: 'right' }}
          >
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          onClick={restart}
          className="text-xs px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          restart
        </button>
      </div>

      {/* Instructions */}
      {!running && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm" style={{ color: '#4B5563' }}>tap a card to start the clock</p>
        </div>
      )}

      {/* Cards grid */}
      <div className="flex-1 p-5">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          <AnimatePresence>
            {cards.map(card => (
              <motion.button
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: card.matched ? 0 : 1,
                  scale: card.matched ? 0.8 : 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={() => !card.matched && handleCardClick(card.id)}
                className={`match-card p-4 rounded-xl text-left text-sm font-medium text-white transition-all min-h-[80px] flex items-center ${
                  card.selected ? 'selected' :
                  card.matched ? 'matched' :
                  card.wrong ? 'wrong' : ''
                } ${card.wrong ? 'shake' : ''}`}
                style={{
                  background: card.matched ? 'transparent' :
                    card.selected ? 'rgba(124,58,237,0.2)' :
                    card.wrong ? 'rgba(239,68,68,0.1)' : '#12121F',
                  border: `1px solid ${
                    card.selected ? '#A78BFA' :
                    card.wrong ? '#EF4444' : '#2D2B55'
                  }`,
                  boxShadow: card.selected ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: card.matched ? 'default' : 'pointer',
                  pointerEvents: card.matched ? 'none' : 'auto',
                }}
              >
                <span className="text-xs mr-2 opacity-50">
                  {card.type === 'term' ? 'T' : 'D'}
                </span>
                {card.text.length > 60 ? card.text.slice(0, 60) + '...' : card.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
