import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, BookOpen, Target, Shuffle, BarChart3, ArrowRight } from 'lucide-react';
import TextGlitch from './ui/TextGlitch';
import BlurText from './ui/BlurText';

interface LandingPageProps {
  onGetStarted: () => void;
}

const features = [
  { icon: BookOpen, label: 'Flashcard Mode', desc: 'flip, know it, move on' },
  { icon: Target, label: 'Learn Mode', desc: 'adaptive mastery, no cap' },
  { icon: BarChart3, label: 'Test Mode', desc: 'graded, real talk' },
  { icon: Shuffle, label: 'Match Mode', desc: 'race the clock fr' },
  { icon: Lock, label: 'Offline First', desc: 'no login needed' },
  { icon: Zap, label: 'Import Sets', desc: 'from anywhere, gang' },
];

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const id = rippleId.current++;
    setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0A0A14' }}
      onClick={handleClick}
    >
      {/* Mouse gradient */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124,58,237,0.08), transparent 70%)`,
        }}
      />

      {/* Grid lines */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating blobs */}
      {[
        { x: '10%', y: '15%', size: 300, color: 'rgba(124,58,237,0.12)', delay: 0 },
        { x: '80%', y: '20%', size: 200, color: 'rgba(79,70,229,0.1)', delay: 1 },
        { x: '60%', y: '70%', size: 250, color: 'rgba(167,139,250,0.08)', delay: 2 },
        { x: '20%', y: '75%', size: 180, color: 'rgba(236,72,153,0.07)', delay: 0.5 },
      ].map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            background: blob.color,
            filter: 'blur(60px)',
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6 + blob.delay, repeat: Infinity, delay: blob.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            className="fixed rounded-full pointer-events-none border border-violet-500/30"
            style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#A78BFA',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Lock size={12} />
          study app that actually goes hard
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display text-white mb-6"
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(4rem, 12vw, 9rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
          }}
        >
          <TextGlitch text="LOCK IT IN" />
          <span style={{ display: 'block', fontSize: '0.45em', color: '#A78BFA', letterSpacing: '0.02em' }}>
            !
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl mb-12 max-w-lg mx-auto"
          style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}
        >
          <BlurText
            text="The study app that actually goes hard. No paywalls. No cringe. Just locked in."
            delay={500}
            wordDelay={60}
          />
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); onGetStarted(); }}
            className="group flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              boxShadow: '0 0 40px rgba(124,58,237,0.4)',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
            }}
          >
            Start Locking In
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <span className="text-sm" style={{ color: '#4B5563', fontFamily: 'DM Sans, sans-serif' }}>
            no account needed, fr
          </span>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-20 max-w-2xl mx-auto"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              whileHover={{ y: -4, borderColor: 'rgba(167,139,250,0.4)' }}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all"
              style={{
                background: '#12121F',
                border: '1px solid #2D2B55',
              }}
            >
              <feat.icon size={20} className="text-violet-400" />
              <div>
                <div className="font-semibold text-sm text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {feat.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  {feat.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
