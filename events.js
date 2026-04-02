// ── TB Events — Lightweight pub/sub bus for cross-section state ──
// Decouples features that share state (e.g., pace ↔ countdown, theme ↔ passport).
// ~20 lines. No dependencies.

// Expose on window for cross-script access and testability
const TB_Events = window.TB_Events = (() => {
  const listeners = {};

  return {
    on(event, fn) {
      (listeners[event] ||= []).push(fn);
    },

    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },

    emit(event, data) {
      (listeners[event] || []).forEach(fn => fn(data));
    },
  };
})();
