import { useEffect, useState } from 'react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: boolean;
}

export default function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
  color = '#7C3AED',
  trackColor = '#2D2B55',
  label = true,
}: ProgressRingProps) {
  const [animPercent, setAnimPercent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {label && (
        <span
          className="absolute text-center"
          style={{
            fontSize: size * 0.22,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#A78BFA',
            fontWeight: 500,
          }}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
