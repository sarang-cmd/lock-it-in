import { motion } from 'framer-motion';

// Generate 7-day activity data (from localStorage session records)
function getWeekActivity(): number[] {
  const days = Array(7).fill(0);
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 86400000).toDateString();
    const count = parseInt(localStorage.getItem(`lii_activity_${date}`) || '0');
    days[6 - i] = count;
  }
  return days;
}

export function recordTodayActivity() {
  const today = new Date().toDateString();
  const key = `lii_activity_${today}`;
  const count = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, String(count + 1));
}

// Shift labels to match days (get last 7 days)
function getLastSevenDayLabels(): string[] {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]);
  }
  return labels;
}

export default function WeeklyHeatmap() {
  const activity = getWeekActivity();
  const labels = getLastSevenDayLabels();
  const max = Math.max(...activity, 1);

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: '#12121F', border: '1px solid #2D2B55' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}>
          7-day activity
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {activity.map((count, i) => {
          const heightPct = count === 0 ? 0.08 : count / max;
          const opacity = count === 0 ? 0.15 : 0.4 + heightPct * 0.6;
          const isToday = i === 6;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-sm"
                style={{
                  background: isToday ? '#A78BFA' : '#7C3AED',
                  opacity,
                  height: `${Math.max(4, heightPct * 40)}px`,
                }}
                initial={{ height: 4, opacity: 0 }}
                animate={{ height: `${Math.max(4, heightPct * 40)}px`, opacity }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {labels.map((label, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px]"
            style={{
              color: i === 6 ? '#A78BFA' : '#4B5563',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
