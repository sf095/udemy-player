import { X, Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'Video Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['←'], description: 'Seek backward 5s' },
      { keys: ['→'], description: 'Seek forward 5s' },
      { keys: ['J'], description: 'Seek backward 10s' },
      { keys: ['L'], description: 'Seek forward 10s' },
      { keys: ['↑'], description: 'Volume up 10%' },
      { keys: ['↓'], description: 'Volume down 10%' },
      { keys: ['M'], description: 'Toggle mute' },
      { keys: ['F'], description: 'Toggle fullscreen' },
      { keys: ['T'], description: 'Toggle theater mode' },
      { keys: ['['], description: 'Decrease speed' },
      { keys: [']'], description: 'Increase speed' },
      { keys: ['0-9'], description: 'Seek to 0%–90%' },
    ]
  },
  {
    title: 'Lesson Navigation',
    shortcuts: [
      { keys: ['Shift', 'N'], description: 'Next lesson' },
      { keys: ['Shift', 'P'], description: 'Previous lesson' },
      { keys: ['Shift', '↵'], description: 'Toggle complete' },
    ]
  },
  {
    title: 'UI Panels',
    shortcuts: [
      { keys: ['B'], description: 'Toggle sidebar' },
      { keys: ['N'], description: 'Toggle notes panel' },
      { keys: ['C'], description: 'Toggle chapters panel' },
      { keys: ['Esc'], description: 'Close modal' },
    ]
  },
  {
    title: 'App',
    shortcuts: [
      { keys: ['?'], description: 'This shortcut sheet' },
      { keys: [','], description: 'Open settings' },
    ]
  }
];

export default function KeyboardShortcutsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shortcuts-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Keyboard size={20} style={{ color: 'var(--primary)' }} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className="shortcuts-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="shortcuts-modal-body">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="shortcut-group">
              <h3 className="shortcut-group-title">{group.title}</h3>
              <div className="shortcut-list">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="shortcut-row">
                    <span className="shortcut-description">{s.description}</span>
                    <span className="shortcut-keys">
                      {s.keys.map((k, j) => (
                        <span key={j}>
                          {j > 0 && <span className="shortcut-plus">+</span>}
                          <kbd className="shortcut-kbd">{k}</kbd>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="shortcuts-modal-footer">
          Press <kbd className="shortcut-kbd">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
