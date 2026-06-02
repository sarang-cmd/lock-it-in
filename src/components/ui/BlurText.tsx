import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordDelay?: number;
}

export default function BlurText({ text, className, delay = 0, wordDelay = 120 }: BlurTextProps) {
  const [visible, setVisible] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <span className={cn('inline', className)}>
      {words.map((word, i) => (
        <span
          key={i}
          className="blur-word"
          style={{ animationDelay: `${i * wordDelay}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  );
}
