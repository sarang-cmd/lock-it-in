import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const PALETTE = ['#4F46E5', '#7C3AED', '#A78BFA', '#C4B5FD', '#6366F1'];

export default function WaveTransition({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const BAR_COUNT = 40;
    const barWidth = canvas.width / BAR_COUNT;
    const phases = Array.from({ length: BAR_COUNT }, (_, i) => i * 0.3);

    function draw() {
      if (!ctx || !canvas) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0A0A14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < BAR_COUNT; i++) {
        const h = (Math.sin(elapsed * 4 + phases[i]) * 0.4 + 0.6) * canvas.height * 0.7;
        const y = (canvas.height - h) / 2;
        const alpha = 0.6 + Math.sin(elapsed * 2 + phases[i]) * 0.4;
        ctx.fillStyle = PALETTE[i % PALETTE.length] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(i * barWidth + 1, y, barWidth - 2, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    const timeout = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      onComplete();
    }, 600);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[1000]"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}
