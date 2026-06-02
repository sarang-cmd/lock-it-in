import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, X, AlertCircle } from 'lucide-react';
import { StudySet, Term } from '../../types';
import { shuffleArray, fuzzyMatch } from '../../lib/utils';
import Confetti from '../ui/Confetti';

interface TestModeProps {
  set: StudySet;
  onBack: () => void;
}

type TestQuestion =
  | { type: 'written'; term: Term; userAnswer: string; answered: boolean }
  | { type: 'mc'; term: Term; options: string[]; userAnswer: string; answered: boolean }
  | { type: 'tf'; term: Term; tfStatement: string; tfCorrect: boolean; userAnswer: string; answered: boolean };

function buildTest(terms: Term[], count: number): TestQuestion[] {
  const shuffled = shuffleArray(terms).slice(0, count);
  return shuffled.map((term, i) => {
    const r = i % 10;
    if (r < 4) { // 40% MC
      const others = terms.filter(t => t.id !== term.id);
      const distractors = shuffleArray(others).slice(0, 3).map(t => t.definition);
      return {
        type: 'mc',
        term,
        options: shuffleArray([term.definition, ...distractors]),
        userAnswer: '',
        answered: false,
      };
    }
    if (r < 7) { // 30% written
      return { type: 'written', term, userAnswer: '', answered: false };
    }
    // 30% T/F
    const useCorrect = Math.random() > 0.5;
    const other = terms.filter(t => t.id !== term.id);
    const wrong = other[Math.floor(Math.random() * other.length)];
    return {
      type: 'tf',
      term,
      tfStatement: useCorrect ? term.definition : (wrong?.definition || term.definition),
      tfCorrect: useCorrect || !wrong,
      userAnswer: '',
      answered: false,
    };
  });
}

const SCORE_COPY: Record<string, string> = {
  A: 'gang you just cooked that test 🔥',
  B: 'solid. a few slipped but you\'re locked in',
  C: 'mid performance. lock it in harder next time',
  D: 'ok we need to talk. pull up to learn mode fr',
};

export default function TestMode({ set, onBack }: TestModeProps) {
  const [questionCount, setQuestionCount] = useState(Math.min(20, set.terms.length));
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [started, setStarted] = useState(false);

  const startTest = () => {
    setQuestions(buildTest(set.terms, questionCount));
    setStarted(true);
  };

  const updateAnswer = (idx: number, answer: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, userAnswer: answer } : q));
  };

  const handleSubmit = () => {
    setQuestions(prev => prev.map(q => ({ ...q, answered: true })));
    setSubmitted(true);
    const score = calcScore();
    if (score >= 90) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 5000);
    }
  };

  const calcScore = () => {
    if (!questions.length) return 0;
    let correct = 0;
    for (const q of questions) {
      if (q.type === 'written') {
        if (fuzzyMatch(q.userAnswer, q.term.definition)) correct++;
      } else if (q.type === 'mc') {
        if (q.userAnswer === q.term.definition) correct++;
      } else if (q.type === 'tf') {
        const userBool = q.userAnswer === 'true';
        if (userBool === q.tfCorrect) correct++;
      }
    }
    return Math.round((correct / questions.length) * 100);
  };

  const score = submitted ? calcScore() : 0;
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: '#0A0A14' }}>
        <div
          className="flex items-center gap-2 text-sm mb-8 cursor-pointer"
          style={{ color: '#9CA3AF' }}
          onClick={onBack}
        >
          <ChevronLeft size={16} /> back
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="text-5xl mb-6">📝</div>
          <h2
            className="text-2xl font-black text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Test Mode
          </h2>
          <p className="mb-8 text-sm" style={{ color: '#9CA3AF' }}>
            {set.terms.length} terms available
          </p>

          <div
            className="p-5 rounded-2xl mb-6"
            style={{ background: '#12121F', border: '1px solid #2D2B55' }}
          >
            <label className="block text-sm font-medium mb-3 text-left" style={{ color: '#9CA3AF' }}>
              how many questions?
            </label>
            <input
              type="range"
              min={5}
              max={set.terms.length}
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="w-full mb-2"
              style={{ accentColor: '#7C3AED' }}
            />
            <div className="text-2xl font-bold text-center text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {questionCount}
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 rounded-xl font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'Syne, sans-serif' }}
          >
            Start Test
          </button>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    const correct = questions.filter(q => {
      if (q.type === 'written') return fuzzyMatch(q.userAnswer, q.term.definition);
      if (q.type === 'mc') return q.userAnswer === q.term.definition;
      if (q.type === 'tf') return (q.userAnswer === 'true') === q.tfCorrect;
      return false;
    }).length;

    return (
      <div className="min-h-screen" style={{ background: '#0A0A14' }}>
        <Confetti active={confetti} />
        <div className="max-w-2xl mx-auto px-5 py-8">
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div
              className="text-8xl font-black mb-4"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
              }}
            >
              {score}%
            </div>
            <p className="text-lg font-semibold mb-1 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {SCORE_COPY[grade]}
            </p>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {correct} / {questions.length} correct
            </p>
          </motion.div>

          {/* Review */}
          <div className="space-y-3 mb-8">
            {questions.map((q, i) => {
              let isCorrect = false;
              let correctAnswer = '';
              if (q.type === 'written') {
                isCorrect = fuzzyMatch(q.userAnswer, q.term.definition);
                correctAnswer = q.term.definition;
              } else if (q.type === 'mc') {
                isCorrect = q.userAnswer === q.term.definition;
                correctAnswer = q.term.definition;
              } else if (q.type === 'tf') {
                isCorrect = (q.userAnswer === 'true') === q.tfCorrect;
                correctAnswer = q.tfCorrect ? 'True' : 'False';
              }
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: '#12121F',
                    border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {isCorrect
                        ? <Check size={16} style={{ color: '#10B981' }} />
                        : <X size={16} style={{ color: '#EF4444' }} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{q.term.term}</p>
                      {!isCorrect && (
                        <>
                          <p className="text-xs mb-0.5" style={{ color: '#EF4444' }}>
                            your answer: {q.userAnswer || '(empty)'}
                          </p>
                          <p className="text-xs" style={{ color: '#10B981' }}>
                            correct: {correctAnswer}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'DM Sans, sans-serif' }}
          >
            back to set
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = questions.filter(q => q.userAnswer !== '').length;

  return (
    <div className="min-h-screen" style={{ background: '#0A0A14' }}>
      {/* Top */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2D2B55' }}
      >
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#9CA3AF' }}>
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
          {answeredCount}/{questions.length} answered
        </span>
        <button
          onClick={handleSubmit}
          disabled={answeredCount === 0}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: answeredCount > 0 ? '#7C3AED' : '#2D2B55',
            fontFamily: 'DM Sans, sans-serif',
            cursor: answeredCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          submit
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-5 rounded-2xl"
            style={{ background: '#12121F', border: '1px solid #2D2B55' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}
              >
                {i + 1}. {q.type === 'written' ? 'written' : q.type === 'mc' ? 'multiple choice' : 'true/false'}
              </span>
            </div>
            <p className="font-semibold text-white mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {q.type === 'tf'
                ? <>Is this the definition of <span style={{ color: '#A78BFA' }}>{q.term.term}</span>? "{q.tfStatement}"</>
                : <>Define: <span style={{ color: '#A78BFA' }}>{q.term.term}</span></>
              }
            </p>

            {q.type === 'written' && (
              <input
                value={q.userAnswer}
                onChange={e => updateAnswer(i, e.target.value)}
                placeholder="type your answer..."
                className="w-full px-4 py-3 rounded-xl text-white outline-none input-glow"
                style={{ background: '#0A0A14', border: '1px solid #2D2B55', fontFamily: 'DM Sans, sans-serif' }}
              />
            )}

            {q.type === 'mc' && (
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => updateAnswer(i, opt)}
                    className="text-left p-3 rounded-xl text-sm transition-all"
                    style={{
                      background: q.userAnswer === opt ? 'rgba(124,58,237,0.2)' : '#0A0A14',
                      border: `1px solid ${q.userAnswer === opt ? '#7C3AED' : '#2D2B55'}`,
                      color: q.userAnswer === opt ? '#A78BFA' : '#F1F0FF',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'tf' && (
              <div className="grid grid-cols-2 gap-3">
                {['true', 'false'].map(val => (
                  <button
                    key={val}
                    onClick={() => updateAnswer(i, val)}
                    className="py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: q.userAnswer === val
                        ? val === 'true' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                        : '#0A0A14',
                      border: `1px solid ${q.userAnswer === val
                        ? val === 'true' ? '#10B981' : '#EF4444'
                        : '#2D2B55'}`,
                      color: q.userAnswer === val
                        ? val === 'true' ? '#10B981' : '#EF4444'
                        : '#9CA3AF',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {val === 'true' ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Warning if not all answered */}
        {answeredCount < questions.length && (
          <div
            className="flex items-center gap-2 p-4 rounded-xl text-sm"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#F59E0B',
            }}
          >
            <AlertCircle size={16} />
            {questions.length - answeredCount} questions unanswered
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl font-bold text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'Syne, sans-serif' }}
        >
          Submit Test
        </button>
      </div>
    </div>
  );
}
