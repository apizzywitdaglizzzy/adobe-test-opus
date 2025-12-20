import React from 'react';
import { EditorState } from '../../types';

interface ToolbarProps {
  tool: EditorState['tool'];
  onToolChange: (tool: EditorState['tool']) => void;
  snapping: boolean;
  onSnappingChange: (enabled: boolean) => void;
  showWaveforms: boolean;
  onShowWaveformsChange: (show: boolean) => void;
  showThumbnails: boolean;
  onShowThumbnailsChange: (show: boolean) => void;
}

const tools: { id: EditorState['tool']; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: '⊹', label: 'Selection Tool', shortcut: 'V' },
  { id: 'razor', icon: '✂', label: 'Razor Tool', shortcut: 'C' },
  { id: 'slip', icon: '↔', label: 'Slip Tool', shortcut: 'Y' },
  { id: 'slide', icon: '⇔', label: 'Slide Tool', shortcut: 'U' },
  { id: 'ripple', icon: '⟪', label: 'Ripple Edit Tool', shortcut: 'B' },
  { id: 'roll', icon: '⟺', label: 'Rolling Edit Tool', shortcut: 'N' },
  { id: 'hand', icon: '✋', label: 'Hand Tool', shortcut: 'H' },
  { id: 'zoom', icon: '🔍', label: 'Zoom Tool', shortcut: 'Z' },
];

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  snapping,
  onSnappingChange,
  showWaveforms,
  onShowWaveformsChange,
  showThumbnails,
  onShowThumbnailsChange,
}) => {
  return (
    <div className="h-10 bg-editor-surface border-b border-editor-border flex items-center px-2 gap-1">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 bg-editor-panel rounded p-0.5">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              tool === t.id
                ? 'bg-editor-accent text-white'
                : 'text-editor-text-secondary hover:bg-editor-border hover:text-editor-text'
            }`}
            onClick={() => onToolChange(t.id)}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-editor-border mx-2" />

      {/* Toggle buttons */}
      <button
        className={`px-3 h-7 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          snapping
            ? 'bg-editor-accent text-white'
            : 'bg-editor-panel text-editor-text-secondary hover:text-editor-text'
        }`}
        onClick={() => onSnappingChange(!snapping)}
        title="Toggle Snapping (S)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Snap
      </button>

      <button
        className={`px-3 h-7 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          showWaveforms
            ? 'bg-editor-accent text-white'
            : 'bg-editor-panel text-editor-text-secondary hover:text-editor-text'
        }`}
        onClick={() => onShowWaveformsChange(!showWaveforms)}
        title="Toggle Waveforms"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Waveforms
      </button>

      <button
        className={`px-3 h-7 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          showThumbnails
            ? 'bg-editor-accent text-white'
            : 'bg-editor-panel text-editor-text-secondary hover:text-editor-text'
        }`}
        onClick={() => onShowThumbnailsChange(!showThumbnails)}
        title="Toggle Thumbnails"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Thumbnails
      </button>

      <div className="flex-1" />

      {/* Workspace presets */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-editor-text-secondary mr-2">Workspace:</span>
        {['Editing', 'Color', 'Audio', 'Effects'].map((workspace) => (
          <button
            key={workspace}
            className={`px-3 h-7 rounded text-xs font-medium transition-colors ${
              workspace === 'Editing'
                ? 'bg-editor-accent text-white'
                : 'bg-editor-panel text-editor-text-secondary hover:text-editor-text'
            }`}
          >
            {workspace}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
