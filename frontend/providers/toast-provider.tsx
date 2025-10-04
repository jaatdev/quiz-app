'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  id: number;
  variant: ToastVariant;
  title?: string;
  description?: string;
  duration: number;
}

type ShowToastInput =
  | string
  | {
      title?: string;
      description?: string;
      message?: string;
      variant?: ToastVariant;
      duration?: number;
    };

interface ToastContextValue {
  showToast: (input: ShowToastInput) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

const variantStyles: Record<ToastVariant, { container: string; icon: ReactElement }> = {
  success: {
    container: 'border-green-200 bg-green-50 text-green-800',
    icon: <CheckCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />,
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: <Info className="mt-0.5 h-5 w-5" aria-hidden="true" />,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden="true" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: number, duration: number) => {
      if (duration <= 0) return;

      const existing = timersRef.current.get(id);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);

      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const showToast = useCallback(
    (input: ShowToastInput) => {
      const { title, description, message, variant = 'info', duration = DEFAULT_DURATION } =
        typeof input === 'string'
          ? { title: input, description: undefined, message: undefined, variant: 'info' as ToastVariant, duration: DEFAULT_DURATION }
          : {
              title: input.title ?? input.message,
              description: input.description,
              message: input.message,
              variant: input.variant ?? 'info',
              duration: input.duration ?? DEFAULT_DURATION,
            };

      if (!title && !description) {
        return -1;
      }

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const toast: ToastOptions = {
        id,
        variant,
        title: title ?? undefined,
        description,
        duration,
      };

      setToasts((prev) => [...prev, toast]);
      scheduleDismiss(id, duration);

      return id;
    },
    [scheduleDismiss]
  );

  const dismissToast = useCallback(
    (id: number) => {
      removeToast(id);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
                style.container
              )}
              role="status"
              aria-live="polite"
            >
              {style.icon}
              <div className="flex-1 text-sm">
                {toast.title && <p className="font-medium">{toast.title}</p>}
                {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="rounded-md p-1 text-current transition hover:bg-white/60"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
