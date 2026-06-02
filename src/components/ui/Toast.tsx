import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const typeStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  info: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
};

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`pointer-events-auto px-4 py-3 rounded-xl border text-sm font-medium
        ${typeStyles[toast.type ?? 'info']} backdrop-blur-md shadow-lg`}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {toast.message}
    </motion.div>
  );
}

let toastQueue: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

export function setToastHandler(handler: (toast: Omit<ToastMessage, 'id'>) => void) {
  toastQueue = handler;
}

export function toast(message: string, type: ToastMessage['type'] = 'info', duration = 3000) {
  if (toastQueue) {
    toastQueue({ message, type, duration });
  }
}
