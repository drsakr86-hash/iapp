/**
 * Toast notifications.
 *
 * Step 15 of the phase plan requires every important operation to have a
 * loading, success and error state and to never fail silently. This is the
 * shared error/success surface those states report into. Messages are
 * Arabic and user-facing; technical detail is logged, not rendered.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastContextValue, type ToastKind } from './toast-context';


const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), VISIBLE_MS),
      );
    },
    [dismiss],
  );

  const success = useCallback((m: string) => show(m, 'success'), [show]);
  const error = useCallback((m: string) => show(m, 'error'), [show]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, success, error, dismiss }),
    [toasts, show, success, error, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
