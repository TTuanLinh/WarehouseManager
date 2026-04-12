type InvalidateFn = () => void;

let onInvalidate: InvalidateFn | null = null;

export function setSessionInvalidateHandler(fn: InvalidateFn | null) {
  onInvalidate = fn;
}

export function invalidateStoredSession() {
  onInvalidate?.();
}
