import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadialShader from './ui/RadialShader';
import TextGlitch from './ui/TextGlitch';
import BlurText from './ui/BlurText';

interface PreloadScreenProps {
  onComplete: () => void;
}

export default function PreloadScreen({ onComplete }: PreloadScreenProps) {
  const [phase, setPhase] = useState<'shader' | 'tagline' | 'exit'>('shader');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    const t3 = setTimeout(() => onComplete(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="preload"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0A0A14' }}
        >
          <RadialShader />

          {/* Main wordmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 text-center"
          >
            <div
              className="font-display font-black text-white select-none"
              style={{
                fontSize: 'clamp(3rem, 10vw, 8rem)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textShadow: '0 0 60px rgba(124,58,237,0.5)',
              }}
            >
              <TextGlitch text="LOCK IT IN" autoPlay onHover={false} />
            </div>

            {phase === 'tagline' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-2xl font-light text-violet-300"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <BlurText text="study different." delay={0} wordDelay={150} />
              </motion.div>
            )}
          </motion.div>

          {/* Bottom loading bar */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.2, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
