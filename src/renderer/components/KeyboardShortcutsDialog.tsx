import React from 'react';

interface KeyboardShortcutsDialogProps {
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Playback',
    items: [
      { key: 'Space', description: 'Play/Pause' },
      { key: 'Enter', description: 'Stop' },
      { key: 'Home', description: 'Go to Start' },
      { key: 'End', description: 'Go to End' },
      { key: '←', description: 'Previous Frame' },
      { key: '→', description: 'Next Frame' },
      { key: 'J', description: 'Play Backwards' },
      { key: 'K', description: 'Stop' },
      { key: 'L', description: 'Play Forward' },
      { key: 'I', description: 'Set In Point' },
      { key: 'O', description: 'Set Out Point' },
    ],
  },
  {
    category: 'Tools',
    items: [
      { key: 'V', description: 'Selection Tool' },
      { key: 'C', description: 'Razor Tool' },
      { key: 'Y', description: 'Slip Tool' },
      { key: 'U', description: 'Slide Tool' },
      { key: 'B', description: 'Ripple Edit Tool' },
      { key: 'N', description: 'Rolling Edit Tool' },
      { key: 'H', description: 'Hand Tool' },
      { key: 'Z', description: 'Zoom Tool' },
    ],
  },
  {
    category: 'Editing',
    items: [
      { key: 'Ctrl+K / Cmd+K', description: 'Split Clip at Playhead' },
      { key: 'Delete', description: 'Delete Selected' },
      { key: 'Shift+Delete', description: 'Ripple Delete' },
      { key: 'Ctrl+Z / Cmd+Z', description: 'Undo' },
      { key: 'Ctrl+Shift+Z / Cmd+Shift+Z', description: 'Redo' },
      { key: 'Ctrl+C / Cmd+C', description: 'Copy' },
      { key: 'Ctrl+V / Cmd+V', description: 'Paste' },
      { key: 'Ctrl+X / Cmd+X', description: 'Cut' },
      { key: 'Ctrl+A / Cmd+A', description: 'Select All' },
      { key: 'Ctrl+Shift+A / Cmd+Shift+A', description: 'Deselect All' },
    ],
  },
  {
    category: 'Timeline',
    items: [
      { key: 'S', description: 'Toggle Snapping' },
      { key: '=', description: 'Zoom In' },
      { key: '-', description: 'Zoom Out' },
      { key: '\\', description: 'Fit Timeline to Window' },
      { key: '↑', description: 'Move Clip Up' },
      { key: '↓', description: 'Move Clip Down' },
      { key: 'Alt+↑', description: 'Nudge Clip Up One Track' },
      { key: 'Alt+↓', description: 'Nudge Clip Down One Track' },
    ],
  },
  {
    category: 'File',
    items: [
      { key: 'Ctrl+N / Cmd+N', description: 'New Project' },
      { key: 'Ctrl+O / Cmd+O', description: 'Open Project' },
      { key: 'Ctrl+S / Cmd+S', description: 'Save Project' },
      { key: 'Ctrl+Shift+S / Cmd+Shift+S', description: 'Save As' },
      { key: 'Ctrl+I / Cmd+I', description: 'Import Media' },
      { key: 'Ctrl+E / Cmd+E', description: 'Export' },
    ],
  },
  {
    category: 'View',
    items: [
      { key: 'F11', description: 'Toggle Fullscreen' },
      { key: 'F12', description: 'Toggle Developer Tools' },
      { key: 'Ctrl+/ / Cmd+/', description: 'Show Keyboard Shortcuts' },
    ],
  },
];

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface rounded-lg shadow-2xl w-[800px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category} className="space-y-2">
                <h3 className="text-sm font-medium text-editor-accent">{section.category}</h3>
                <div className="bg-editor-panel rounded overflow-hidden">
                  {section.items.map((item, index) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between px-3 py-2 ${
                        index !== section.items.length - 1 ? 'border-b border-editor-border' : ''
                      }`}
                    >
                      <span className="text-sm text-editor-text-secondary">{item.description}</span>
                      <kbd className="px-2 py-1 bg-editor-bg rounded text-xs font-mono">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-4 py-3 border-t border-editor-border">
          <p className="text-xs text-editor-text-secondary">
            Press <kbd className="px-1.5 py-0.5 bg-editor-panel rounded text-xs">Esc</kbd> or click
            outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsDialog;
