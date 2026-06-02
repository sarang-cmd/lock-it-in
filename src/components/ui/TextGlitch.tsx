import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

interface TextGlitchProps {
  text: string;
  className?: string;
  autoPlay?: boolean;
  onHover?: boolean;
}

export default function TextGlitch({ text, className, autoPlay = false, onHover = true }: TextGlitchProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iterationRef = useRef(0);

  const glitch = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    iterationRef.current = 0;

    intervalRef.current = setInterval(() => {
      iterationRef.current++;
      const progress = iterationRef.current / (text.length * 3);

      setDisplayText(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iterationRef.current / 3) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (progress >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, 30);
  };

  useEffect(() => {
    if (autoPlay) {
      timeoutRef.current = setTimeout(glitch, 200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [autoPlay, text]);

  return (
    <span
      className={cn('cursor-default select-none', className)}
      onMouseEnter={onHover ? glitch : undefined}
      style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em' }}
    >
      {displayText}
    </span>
  );
}
