import { useEffect, useRef } from 'react';

/**
 * Centralized keyboard shortcut hook.
 *
 * @param {Array<{key: string, modifiers?: string[], action: Function, when?: Function}>} shortcuts
 * @param {{ enabled?: boolean }} options
 */
export default function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Suppress shortcuts when typing in text fields (except Escape)
      const el = document.activeElement;
      const tag = el?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el?.isContentEditable
      ) {
        if (e.key !== 'Escape') return;
      }

      for (const shortcut of shortcutsRef.current) {
        const { key, modifiers = [], action, when } = shortcut;

        // Check guard condition
        if (when && !when()) continue;

        // Check modifier keys
        const needShift = modifiers.includes('shift');
        const needCtrl = modifiers.includes('ctrl');
        const needMeta = modifiers.includes('meta');
        const needAlt = modifiers.includes('alt');

        if (e.shiftKey !== needShift) continue;
        if (e.ctrlKey !== needCtrl) continue;
        if (e.metaKey !== needMeta) continue;
        if (e.altKey !== needAlt) continue;

        // Check key match
        if (e.key === key) {
          e.preventDefault();
          e.stopPropagation();
          action(e);
          return;
        }
      }
    };

    // Capture phase fires before native video controls
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
}
