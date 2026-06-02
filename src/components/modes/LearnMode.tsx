import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X } from 'lucide-react';
import { StudySet, Term } from '../../types';
import { shuffleArray, fuzzyMatch } from '../../lib/utils';
import { toast } from '../ui/Toast';
import Confetti from '../ui/Confetti';

interface LearnModeProps {
  set: StudySet;
  onBack: () => void;
}

type QuestionType = 'multiple-choice' | 'true-false' | 'written';

interface Question {
  term: Term;
  type: QuestionType;
  options?: string[];  // for MC
  tfStatement?: string; // for T/F
  tfCorrect?: boolean;
}

function buildQuestion(term: Term, allTerms: Term[]): Question {
  const types: QuestionType[] = ['multiple-choice', 'multiple-choice', 'written', 'true-false'];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'multiple-choice') {
    const others = allTerms.filter(t => t.id !== term.id);
    const distractors = shuffleArray(others).slice(0, 3).map(t => t.definition);
    const options = shuffleArray([term.definition, ...distractors]);
    return { term, type, options };
  }

  if (type === 'true-false') {
    const useCorrect = Math.random() > 0.5;
    if (useCorrect) {
      return { term, type, tfStatement: term.definition, tfCorrect: true };
    } else {
      const other = allTerms.filter(t => t.id !== term.id);
      const wrong = other[Math.floor(Math.random() * other.length)];
      return { term, type, tfStatement: wrong?.definition || term.definition, tfCorrect: !wrong };
    }
  }

  return { term, type };
}

const MILESTONE_COPY: Record<number, string> = {
  25: 'aight we building. keep going.',
  50: 'halfway there no cap',
  75: "bro you're cooked (in a good way)",
  100: 'LOCKED IN. actual W.',
};

export default function LearnMode({ set, onBack }: LearnModeProps) {
  const [masteryScores, setMasteryScores] = useState<Record<string, number>>(
    Object.fromEntries(set.terms.map(t => [t.id, t.masteryScore]))
  );
  const [queue, setQueue] = useState<Term[]>(() => shuffleArray(set.terms.filter(t => t.masteryScore < 4)));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null);
  const [wrongTerms, setWrongTerms] = useState<Set<string>>(new Set());
  const [ghostTerms, setGhostTerms] = useState<Record<string, number>>({});
  const [confetti, setConfetti] = useState(false);
  const [milestoneShown, setMilestoneShown] = useState<Set<number>>(new Set());
  const [streak, setStreak] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const masteredCount = Object.values(masteryScores).filter(s => s >= 4).length;
  const progress = Math.round((masteredCount / set.terms.length) * 100);

  useEffect(() => {
    if (queue.length === 0 || currentIdx >= queue.length) return;
    const term = queue[currentIdx];
    setQuestion(buildQuestion(term, set.terms));
    setUserAnswer('');
    setAnswered(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIdx, queue]);

  useEffect(() => {
    // Check milestones
    for (const milestone of [25, 50, 75, 100]) {
      if (progress >= milestone && !milestoneShown.has(milestone)) {
        setMilestoneShown(prev => new Set([...prev, milestone]));
        toast(MILESTONE_COPY[milestone], 'success', 4000);
        if (milestone === 100) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 5000);
          setSessionDone(true);
        }
      }
    }
  }, [progress, milestoneShown]);

  const handleCorrect = useCallback(() => {
    if (!question) return;
    const termId = question.term.id;
    const newScore = Math.min(4, (masteryScores[termId] ?? 0) + 1) as 0 | 1 | 2 | 3 | 4;
    setMasteryScores(prev => ({ ...prev, [termId]: newScore }));
    setStreak(s => s + 1);
    setAnswered('correct');
    setWrongTerms(prev => { const s = new Set(prev); s.delete(termId); return s; });

    // Advance after delay
    setTimeout(() => {
      const newQueue = [...queue];
      // Remove from front, re-add at end if not mastered
      newQueue.splice(currentIdx, 1);
      if (newScore < 4) {
        const insertAt = Math.min(newQueue.length, currentIdx + Math.floor(Math.random() * 4) + 3);
        newQueue.splice(insertAt, 0, { ...question.term, masteryScore: newScore });
      }
      if (newQueue.length === 0) {
        setSessionDone(true);
      } else {
        setQueue(newQueue);
        setCurrentIdx(prev => Math.min(prev, newQueue.length - 1));
      }
    }, 1000);
  }, [question, masteryScores, queue, currentIdx]);

  const handleWrong = useCallback((_correctAns: string) => {
    if (!question) return;
    const termId = question.term.id;
    const newScore = Math.max(0, (masteryScores[termId] ?? 0) - 1) as 0 | 1 | 2 | 3 | 4;
    setMasteryScores(prev => ({ ...prev, [termId]: newScore }));
    setStreak(0);
    setAnswered('wrong');
    setWrongTerms(prev => new Set([...prev, termId]));

    const wrongCount = (ghostTerms[termId] ?? 0) + 1;
    setGhostTerms(prev => ({ ...prev, [termId]: wrongCount }));
    if (wrongCount === 3) {
      toast(`💀 ghost term flagged: "${question.term.term}"`, 'warning', 5000);
    }

    // Re-queue sooner
    setTimeout(() => {
      const newQueue = [...queue];
      newQueue.splice(currentIdx, 1);
      const insertAt = Math.min(newQueue.length, currentIdx + 1);
      newQueue.splice(insertAt, 0, { ...question.term, masteryScore: newScore });
      setQueue(newQueue);
      setCurrentIdx(prev => Math.min(prev, newQueue.length - 1));
    }, 2000);
  }, [question, masteryScores, queue, currentIdx, ghostTerms]);

  const handleMCAnswer = (answer: string) => {
    if (answered) return;
    if (answer === question?.term.definition) {
      handleCorrect();
    } else {
      handleWrong(question?.term.definition || '');
    }
  };

  const handleTFAnswer = (answer: boolean) => {
    if (answered) return;
    if (answer === question?.tfCorrect) {
      handleCorrect();
    } else {
      handleWrong(question?.tfCorrect ? 'True' : 'False');
    }
  };

  const handleWritten = () => {
    if (answered || !question) return;
    const correct = fuzzyMatch(userAnswer, question.term.definition);
    if (correct) {
      handleCorrect();
    } else {
      handleWrong(question.term.definition);
    }
  };

  if (sessionDone || queue.length === 0) {
    const allGhostsCleared = set.terms.every(t => !wrongTerms.has(t.id));
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: '#0A0A14' }}
      >
        <Confetti active={confetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <div className="text-6xl mb-6">🔒</div>
          <h2
            className="text-3xl font-black text-white mb-3"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            LOCKED IN
          </h2>
          {allGhostsCleared && wrongTerms.size === 0 && (
            <p className="text-sm mb-2" style={{ color: '#10B981' }}>
              ghost terms COOKED. W session.
            </p>
          )}
          <p className="text-base mb-8" style={{ color: '#9CA3AF' }}>
            {masteredCount} / {set.terms.length} terms mastered
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onBack}
              className="w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'DM Sans, sans-serif' }}
            >
              back to set
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A14' }}>
      <Confetti active={confetti} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2D2B55' }}>
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: '#9CA3AF' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
            {masteredCount}/{set.terms.length} mastered
          </span>
          {streak > 0 && (
            <span className="text-xs font-medium" style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
              🔥 {streak}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-5" style={{ background: '#2D2B55' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.term.id + question.type + currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full"
          >
            {/* Question card */}
            <div
              className="p-6 rounded-2xl mb-6 transition-all"
              style={{
                background: '#12121F',
                border: `1px solid ${answered === 'correct' ? '#10B981' : answered === 'wrong' ? '#EF4444' : '#2D2B55'}`,
                boxShadow: answered === 'correct' ? '0 0 32px rgba(16,185,129,0.2)' : answered === 'wrong' ? '0 0 32px rgba(239,68,68,0.2)' : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    color: '#A78BFA',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {question.type === 'multiple-choice' ? 'multiple choice' :
                   question.type === 'true-false' ? 'true or false' : 'written'}
                </span>
                {ghostTerms[question.term.id] >= 3 && (
                  <span className="text-xs">💀 ghost term</span>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}>
                {question.type === 'true-false' ? 'Is this the correct definition?' : 'Define:'}
              </p>
              <p
                className="text-xl font-semibold text-white"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
              >
                {question.type === 'true-false' ? (
                  <>
                    <span style={{ color: '#A78BFA' }}>{question.term.term}</span>
                    <span className="block text-sm font-normal mt-2" style={{ color: '#F1F0FF' }}>
                      "{question.tfStatement}"
                    </span>
                  </>
                ) : question.term.term}
              </p>
            </div>

            {/* Answer area */}
            {question.type === 'multiple-choice' && (
              <div className="grid grid-cols-1 gap-3">
                {question.options?.map((option, i) => {
                  const isCorrect = option === question.term.definition;
                  const showResult = answered !== null;
                  return (
                    <motion.button
                      key={i}
                      whileHover={!answered ? { scale: 1.01 } : {}}
                      whileTap={!answered ? { scale: 0.99 } : {}}
                      onClick={() => handleMCAnswer(option)}
                      disabled={!!answered}
                      className="text-left p-4 rounded-xl font-medium text-sm transition-all"
                      style={{
                        background: showResult
                          ? isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.05)'
                          : '#12121F',
                        border: `1px solid ${showResult
                          ? isCorrect ? '#10B981' : 'rgba(239,68,68,0.3)'
                          : '#2D2B55'}`,
                        color: showResult
                          ? isCorrect ? '#10B981' : '#4B5563'
                          : '#F1F0FF',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {question.type === 'true-false' && !answered && (
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTFAnswer(true)}
                  className="py-5 rounded-xl font-bold text-lg"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10B981',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  True
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTFAnswer(false)}
                  className="py-5 rounded-xl font-bold text-lg"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  False
                </motion.button>
              </div>
            )}

            {question.type === 'true-false' && answered && (
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: answered === 'correct' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${answered === 'correct' ? '#10B981' : '#EF4444'}`,
                  color: answered === 'correct' ? '#10B981' : '#EF4444',
                }}
              >
                {answered === 'correct' ? (
                  <span className="flex items-center justify-center gap-2 font-semibold">
                    <Check size={18} /> yep.
                  </span>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 font-semibold mb-2">
                      <X size={18} /> nah.
                    </div>
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>
                      correct: {question.tfCorrect ? 'True' : 'False'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {question.type === 'written' && (
              <div>
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && userAnswer.trim() && handleWritten()}
                    disabled={!!answered}
                    placeholder="type your answer..."
                    className="flex-1 px-4 py-3 rounded-xl text-white outline-none transition-all input-glow"
                    style={{
                      background: '#12121F',
                      border: `1px solid ${answered === 'correct' ? '#10B981' : answered === 'wrong' ? '#EF4444' : '#2D2B55'}`,
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  {!answered && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleWritten}
                      disabled={!userAnswer.trim()}
                      className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                      style={{
                        background: userAnswer.trim() ? '#7C3AED' : '#2D2B55',
                        fontFamily: 'DM Sans, sans-serif',
                        cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      check
                    </motion.button>
                  )}
                </div>
                {answered === 'wrong' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: '#EF4444' }}>nah. it's:</p>
                    <p className="text-sm font-medium text-white">{question.term.definition}</p>
                  </motion.div>
                )}
                {answered === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 rounded-xl text-center"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: '#10B981' }}>yep. ✓</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* First wrong message */}
            {streak === 0 && answered === 'wrong' && Object.values(ghostTerms).reduce((a, b) => a + b, 0) === 1 && (
              <p className="text-xs mt-4 text-center" style={{ color: '#9CA3AF' }}>
                it's ok. learn mode will cook you into shape
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
