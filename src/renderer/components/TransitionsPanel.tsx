import React, { useState, useCallback } from 'react';
import { TransitionType } from '../../types';

interface TransitionPresetData {
  id: TransitionType;
  name: string;
  category: 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'iris' | '3d' | 'page' | 'audio';
  icon: string;
  defaultDuration: number;
  description: string;
}

// Comprehensive list of transitions similar to Adobe Premiere Pro
const TRANSITION_PRESETS: TransitionPresetData[] = [
  // Dissolve Transitions
  { id: 'cross-dissolve', name: 'Cross Dissolve', category: 'dissolve', icon: '◐', defaultDuration: 1.0, description: 'Smooth blend between clips' },
  { id: 'dip-to-black', name: 'Dip to Black', category: 'dissolve', icon: '◑', defaultDuration: 1.0, description: 'Fade through black' },
  { id: 'dip-to-white', name: 'Dip to White', category: 'dissolve', icon: '◒', defaultDuration: 1.0, description: 'Fade through white' },
  { id: 'film-dissolve', name: 'Film Dissolve', category: 'dissolve', icon: '◓', defaultDuration: 1.0, description: 'Cinematic film-like dissolve' },
  { id: 'additive-dissolve', name: 'Additive Dissolve', category: 'dissolve', icon: '◔', defaultDuration: 1.0, description: 'Bright additive blend' },
  { id: 'blur-dissolve', name: 'Blur Dissolve', category: 'dissolve', icon: '◕', defaultDuration: 1.0, description: 'Dissolve with blur effect' },

  // Wipe Transitions
  { id: 'wipe-left', name: 'Wipe Left', category: 'wipe', icon: '◀', defaultDuration: 0.75, description: 'Wipe from right to left' },
  { id: 'wipe-right', name: 'Wipe Right', category: 'wipe', icon: '▶', defaultDuration: 0.75, description: 'Wipe from left to right' },
  { id: 'wipe-up', name: 'Wipe Up', category: 'wipe', icon: '▲', defaultDuration: 0.75, description: 'Wipe from bottom to top' },
  { id: 'wipe-down', name: 'Wipe Down', category: 'wipe', icon: '▼', defaultDuration: 0.75, description: 'Wipe from top to bottom' },
  { id: 'wipe-diagonal', name: 'Diagonal Wipe', category: 'wipe', icon: '◢', defaultDuration: 0.75, description: 'Diagonal corner wipe' },
  { id: 'wipe-clock', name: 'Clock Wipe', category: 'wipe', icon: '⟳', defaultDuration: 1.0, description: 'Clockwise circular wipe' },
  { id: 'wipe-radial', name: 'Radial Wipe', category: 'wipe', icon: '⊙', defaultDuration: 1.0, description: 'Radial outward wipe' },
  { id: 'barn-doors', name: 'Barn Doors', category: 'wipe', icon: '⟺', defaultDuration: 0.75, description: 'Split from center' },
  { id: 'split', name: 'Split', category: 'wipe', icon: '⫿', defaultDuration: 0.75, description: 'Vertical split reveal' },

  // Slide Transitions
  { id: 'push-left', name: 'Push Left', category: 'slide', icon: '⇐', defaultDuration: 0.5, description: 'Push clip off to left' },
  { id: 'push-right', name: 'Push Right', category: 'slide', icon: '⇒', defaultDuration: 0.5, description: 'Push clip off to right' },
  { id: 'push-up', name: 'Push Up', category: 'slide', icon: '⇑', defaultDuration: 0.5, description: 'Push clip off upward' },
  { id: 'push-down', name: 'Push Down', category: 'slide', icon: '⇓', defaultDuration: 0.5, description: 'Push clip off downward' },
  { id: 'slide-left', name: 'Slide Left', category: 'slide', icon: '←', defaultDuration: 0.5, description: 'Slide over from right' },
  { id: 'slide-right', name: 'Slide Right', category: 'slide', icon: '→', defaultDuration: 0.5, description: 'Slide over from left' },
  { id: 'slide-up', name: 'Slide Up', category: 'slide', icon: '↑', defaultDuration: 0.5, description: 'Slide over from bottom' },
  { id: 'slide-down', name: 'Slide Down', category: 'slide', icon: '↓', defaultDuration: 0.5, description: 'Slide over from top' },

  // Zoom Transitions
  { id: 'zoom-in', name: 'Zoom In', category: 'zoom', icon: '⊕', defaultDuration: 0.75, description: 'Zoom into next clip' },
  { id: 'zoom-out', name: 'Zoom Out', category: 'zoom', icon: '⊖', defaultDuration: 0.75, description: 'Zoom out to next clip' },
  { id: 'zoom-cross', name: 'Cross Zoom', category: 'zoom', icon: '⊗', defaultDuration: 1.0, description: 'Zoom through transition' },
  { id: 'cross-stretch', name: 'Cross Stretch', category: 'zoom', icon: '⤢', defaultDuration: 0.75, description: 'Stretch and cross fade' },

  // Iris Transitions
  { id: 'iris-circle', name: 'Iris Circle', category: 'iris', icon: '○', defaultDuration: 0.75, description: 'Circular iris reveal' },
  { id: 'iris-diamond', name: 'Iris Diamond', category: 'iris', icon: '◇', defaultDuration: 0.75, description: 'Diamond shape reveal' },
  { id: 'iris-square', name: 'Iris Square', category: 'iris', icon: '□', defaultDuration: 0.75, description: 'Square shape reveal' },
  { id: 'iris-star', name: 'Iris Star', category: 'iris', icon: '☆', defaultDuration: 0.75, description: 'Star shape reveal' },
  { id: 'iris-heart', name: 'Iris Heart', category: 'iris', icon: '♡', defaultDuration: 0.75, description: 'Heart shape reveal' },

  // 3D Transitions
  { id: 'flip-horizontal', name: 'Flip Horizontal', category: '3d', icon: '⇄', defaultDuration: 0.75, description: '3D horizontal flip' },
  { id: 'flip-vertical', name: 'Flip Vertical', category: '3d', icon: '⇅', defaultDuration: 0.75, description: '3D vertical flip' },
  { id: 'cube-spin', name: 'Cube Spin', category: '3d', icon: '⬡', defaultDuration: 1.0, description: '3D cube rotation' },

  // Page Transitions
  { id: 'page-peel', name: 'Page Peel', category: 'page', icon: '⤴', defaultDuration: 1.0, description: 'Page peel effect' },
  { id: 'page-curl', name: 'Page Curl', category: 'page', icon: '⤵', defaultDuration: 1.0, description: 'Page curl effect' },

  // Special Transitions
  { id: 'morph', name: 'Morph', category: 'dissolve', icon: '∞', defaultDuration: 1.5, description: 'Morphing transition' },
  { id: 'glitch', name: 'Glitch', category: 'dissolve', icon: '⚡', defaultDuration: 0.5, description: 'Digital glitch effect' },

  // Audio Transitions
  { id: 'crossfade-constant-gain', name: 'Constant Gain', category: 'audio', icon: '🔊', defaultDuration: 1.0, description: 'Linear audio crossfade' },
  { id: 'crossfade-constant-power', name: 'Constant Power', category: 'audio', icon: '🔉', defaultDuration: 1.0, description: 'Logarithmic crossfade' },
  { id: 'exponential-fade', name: 'Exponential Fade', category: 'audio', icon: '🔈', defaultDuration: 1.0, description: 'Exponential audio fade' },
];

const CATEGORY_INFO: Record<string, { name: string; color: string }> = {
  dissolve: { name: 'Dissolve', color: '#8b5cf6' },
  wipe: { name: 'Wipe', color: '#3b82f6' },
  slide: { name: 'Slide', color: '#10b981' },
  zoom: { name: 'Zoom', color: '#f59e0b' },
  iris: { name: 'Iris', color: '#ec4899' },
  '3d': { name: '3D Motion', color: '#06b6d4' },
  page: { name: 'Page', color: '#84cc16' },
  audio: { name: 'Audio', color: '#ef4444' },
};

interface TransitionsPanelProps {
  onApplyTransition: (transitionType: TransitionType, duration: number, position: 'in' | 'out') => void;
  selectedClipId: string | null;
  clipType: 'video' | 'audio' | 'image' | 'subtitle' | null;
}

const TransitionsPanel: React.FC<TransitionsPanelProps> = ({
  onApplyTransition,
  selectedClipId,
  clipType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['dissolve', 'wipe', 'slide'])
  );
  const [draggedTransition, setDraggedTransition] = useState<TransitionPresetData | null>(null);
  const [defaultDuration, setDefaultDuration] = useState(1.0);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, transition: TransitionPresetData) => {
    setDraggedTransition(transition);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'transition',
      transitionId: transition.id,
      transitionName: transition.name,
      category: transition.category,
      duration: defaultDuration,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, [defaultDuration]);

  const handleDragEnd = useCallback(() => {
    setDraggedTransition(null);
  }, []);

  const handleDoubleClick = useCallback((transition: TransitionPresetData) => {
    if (selectedClipId && clipType) {
      // Apply to the start of the selected clip
      onApplyTransition(transition.id, defaultDuration, 'in');
    }
  }, [selectedClipId, clipType, defaultDuration, onApplyTransition]);

  // Filter transitions based on search and clip type
  const filteredTransitions = TRANSITION_PRESETS.filter((t) => {
    // Filter by search
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // If audio clip is selected, only show audio transitions
    if (clipType === 'audio') {
      return t.category === 'audio';
    }
    // If video/image clip, show all video transitions
    if (clipType === 'video' || clipType === 'image') {
      return t.category !== 'audio';
    }
    // Show all if no clip selected
    return true;
  });

  // Group by category
  const transitionsByCategory = filteredTransitions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = [];
    }
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, TransitionPresetData[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Transitions</span>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-editor-border">
        <input
          type="text"
          placeholder="Search transitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
        />
      </div>

      {/* Default Duration Setting */}
      <div className="p-2 border-b border-editor-border flex items-center gap-2">
        <span className="text-xs text-editor-text-secondary">Default Duration:</span>
        <input
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={defaultDuration}
          onChange={(e) => setDefaultDuration(parseFloat(e.target.value) || 1.0)}
          className="w-16 h-6 px-1 bg-editor-panel border border-editor-border rounded text-xs text-right focus:outline-none focus:border-editor-accent"
        />
        <span className="text-xs text-editor-text-secondary">sec</span>
      </div>

      {/* Instructions */}
      <div className="p-2 bg-editor-bg/50 text-xs text-editor-text-secondary border-b border-editor-border">
        Drag transition to timeline between clips, or double-click to apply to selected clip
      </div>

      {/* Transitions List */}
      <div className="flex-1 overflow-auto">
        {Object.entries(transitionsByCategory).map(([category, transitions]) => (
          <div key={category} className="border-b border-editor-border">
            {/* Category Header */}
            <button
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-editor-panel text-left"
              onClick={() => toggleCategory(category)}
            >
              <span
                className="text-xs"
                style={{
                  transform: expandedCategories.has(category) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              >
                ▶
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_INFO[category]?.color || '#666' }}
              />
              <span className="text-sm font-medium">{CATEGORY_INFO[category]?.name || category}</span>
              <span className="ml-auto text-xs text-editor-text-secondary">
                {transitions.length}
              </span>
            </button>

            {/* Category Items */}
            {expandedCategories.has(category) && (
              <div className="grid grid-cols-2 gap-1 p-2">
                {transitions.map((transition) => (
                  <div
                    key={transition.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, transition)}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => handleDoubleClick(transition)}
                    className={`
                      p-2 rounded cursor-grab active:cursor-grabbing
                      bg-editor-panel border border-editor-border
                      hover:border-editor-accent hover:bg-editor-bg
                      transition-colors
                      ${draggedTransition?.id === transition.id ? 'opacity-50' : ''}
                    `}
                    title={transition.description}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 flex items-center justify-center rounded text-sm"
                        style={{
                          backgroundColor: CATEGORY_INFO[category]?.color + '20',
                          color: CATEGORY_INFO[category]?.color,
                        }}
                      >
                        {transition.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{transition.name}</div>
                        <div className="text-xs text-editor-text-secondary">
                          {transition.defaultDuration}s
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Clip Info */}
      {selectedClipId && (
        <div className="p-2 border-t border-editor-border bg-editor-surface">
          <div className="text-xs text-editor-text-secondary">
            Selected: {clipType} clip
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitionsPanel;
export { TRANSITION_PRESETS, CATEGORY_INFO };
export type { TransitionPresetData };
