import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration ?? 4000;
    setToasts((prev) => [...prev, { ...opts, id }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((message: string, title?: string) =>
    toast({ variant: 'success', message, title }), [toast]);

  const error = useCallback((message: string, title?: string) =>
    toast({ variant: 'error', message, title, duration: 6000 }), [toast]);

  const warning = useCallback((message: string, title?: string) =>
    toast({ variant: 'warning', message, title }), [toast]);

  const info = useCallback((message: string, title?: string) =>
    toast({ variant: 'info', message, title }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── Individual Toast Item ────────────────────────────────────────────────────

const variantConfig: Record<ToastVariant, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  border: string;
  title: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    bar: 'bg-emerald-500',
    bg: 'bg-surface',
    border: 'border-emerald-200 dark:border-emerald-800',
    title: 'text-emerald-700 dark:text-emerald-400',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    bar: 'bg-red-500',
    bg: 'bg-surface',
    border: 'border-red-200 dark:border-red-800',
    title: 'text-red-700 dark:text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    bar: 'bg-amber-500',
    bg: 'bg-surface',
    border: 'border-amber-200 dark:border-amber-800',
    title: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-500" />,
    bar: 'bg-blue-500',
    bg: 'bg-surface',
    border: 'border-blue-200 dark:border-blue-800',
    title: 'text-blue-700 dark:text-blue-400',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const config = variantConfig[toast.variant];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      role="alert"
      className={`
        relative flex items-start gap-3 w-full max-w-sm rounded-xl shadow-lg border
        px-4 py-3 overflow-hidden
        transition-all duration-300
        ${config.bg} ${config.border}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {/* Left colored bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar} rounded-l-xl`} />

      <div className="mt-0.5 shrink-0 ml-1">{config.icon}</div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-xs font-semibold leading-tight ${config.title}`}>{toast.title}</p>
        )}
        <p className="text-xs text-text leading-relaxed mt-0.5">{toast.message}</p>
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded text-muted hover:text-text transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Container (portal) ──────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: Toast[]; dismiss: (id: string) => void }> = ({
  toasts,
  dismiss,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
};
