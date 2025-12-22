import React, { useState, useCallback } from 'react';
import { Clip, EffectPreset, TransitionPreset, TransitionType } from '../../types';

interface EffectsPanelProps {
  selectedClip: Clip | null;
  onApplyEffect: (effect: EffectPreset) => void;
  onApplyTransition?: (clipId: string, transitionType: TransitionType, duration: number, position: 'in' | 'out') => void;
}

const videoEffects: EffectPreset[] = [
  {
    id: 'blur',
    name: 'Gaussian Blur',
    category: 'Blur & Sharpen',
    icon: '◐',
    defaultParams: [
      { id: 'radius', name: 'Radius', type: 'range', value: 5, defaultValue: 5, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    category: 'Blur & Sharpen',
    icon: '◇',
    defaultParams: [
      { id: 'amount', name: 'Amount', type: 'range', value: 50, defaultValue: 50, min: 0, max: 200, step: 1 },
    ],
  },
  {
    id: 'brightness',
    name: 'Brightness & Contrast',
    category: 'Color Correction',
    icon: '☀',
    defaultParams: [
      { id: 'brightness', name: 'Brightness', type: 'range', value: 0, defaultValue: 0, min: -100, max: 100, step: 1 },
      { id: 'contrast', name: 'Contrast', type: 'range', value: 0, defaultValue: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: 'saturation',
    name: 'Saturation',
    category: 'Color Correction',
    icon: '◈',
    defaultParams: [
      { id: 'saturation', name: 'Saturation', type: 'range', value: 100, defaultValue: 100, min: 0, max: 200, step: 1 },
    ],
  },
  {
    id: 'hue',
    name: 'Hue Shift',
    category: 'Color Correction',
    icon: '◉',
    defaultParams: [
      { id: 'hue', name: 'Hue', type: 'range', value: 0, defaultValue: 0, min: -180, max: 180, step: 1 },
    ],
  },
  {
    id: 'curves',
    name: 'RGB Curves',
    category: 'Color Correction',
    icon: '〜',
    defaultParams: [],
  },
  {
    id: 'colorbalance',
    name: 'Color Balance',
    category: 'Color Correction',
    icon: '⊛',
    defaultParams: [
      { id: 'shadows_r', name: 'Shadows Red', type: 'range', value: 0, defaultValue: 0, min: -100, max: 100, step: 1 },
      { id: 'shadows_g', name: 'Shadows Green', type: 'range', value: 0, defaultValue: 0, min: -100, max: 100, step: 1 },
      { id: 'shadows_b', name: 'Shadows Blue', type: 'range', value: 0, defaultValue: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: 'vignette',
    name: 'Vignette',
    category: 'Stylize',
    icon: '◎',
    defaultParams: [
      { id: 'amount', name: 'Amount', type: 'range', value: 50, defaultValue: 50, min: 0, max: 100, step: 1 },
      { id: 'feather', name: 'Feather', type: 'range', value: 50, defaultValue: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: 'grain',
    name: 'Film Grain',
    category: 'Stylize',
    icon: '⋮',
    defaultParams: [
      { id: 'amount', name: 'Amount', type: 'range', value: 20, defaultValue: 20, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: 'chromatic',
    name: 'Chromatic Aberration',
    category: 'Stylize',
    icon: '◐',
    defaultParams: [
      { id: 'amount', name: 'Amount', type: 'range', value: 5, defaultValue: 5, min: 0, max: 50, step: 1 },
    ],
  },
];

const audioEffects: EffectPreset[] = [
  {
    id: 'gain',
    name: 'Gain',
    category: 'Volume',
    icon: '🔊',
    defaultParams: [
      { id: 'gain', name: 'Gain (dB)', type: 'range', value: 0, defaultValue: 0, min: -24, max: 24, step: 0.1 },
    ],
  },
  {
    id: 'compressor',
    name: 'Compressor',
    category: 'Dynamics',
    icon: '📊',
    defaultParams: [
      { id: 'threshold', name: 'Threshold (dB)', type: 'range', value: -18, defaultValue: -18, min: -60, max: 0, step: 1 },
      { id: 'ratio', name: 'Ratio', type: 'range', value: 4, defaultValue: 4, min: 1, max: 20, step: 0.1 },
      { id: 'attack', name: 'Attack (ms)', type: 'range', value: 10, defaultValue: 10, min: 0.1, max: 100, step: 0.1 },
      { id: 'release', name: 'Release (ms)', type: 'range', value: 100, defaultValue: 100, min: 10, max: 1000, step: 1 },
    ],
  },
  {
    id: 'eq',
    name: 'Parametric EQ',
    category: 'EQ',
    icon: '〰',
    defaultParams: [],
  },
  {
    id: 'reverb',
    name: 'Reverb',
    category: 'Spatial',
    icon: '🔈',
    defaultParams: [
      { id: 'roomSize', name: 'Room Size', type: 'range', value: 50, defaultValue: 50, min: 0, max: 100, step: 1 },
      { id: 'damping', name: 'Damping', type: 'range', value: 50, defaultValue: 50, min: 0, max: 100, step: 1 },
      { id: 'wetDry', name: 'Wet/Dry', type: 'range', value: 30, defaultValue: 30, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: 'delay',
    name: 'Delay',
    category: 'Spatial',
    icon: '↺',
    defaultParams: [
      { id: 'time', name: 'Delay Time (ms)', type: 'range', value: 250, defaultValue: 250, min: 1, max: 2000, step: 1 },
      { id: 'feedback', name: 'Feedback', type: 'range', value: 30, defaultValue: 30, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: 'deesser',
    name: 'De-Esser',
    category: 'Correction',
    icon: 'S',
    defaultParams: [
      { id: 'frequency', name: 'Frequency (Hz)', type: 'range', value: 6000, defaultValue: 6000, min: 2000, max: 10000, step: 100 },
      { id: 'threshold', name: 'Threshold (dB)', type: 'range', value: -20, defaultValue: -20, min: -60, max: 0, step: 1 },
    ],
  },
  {
    id: 'noisereduction',
    name: 'Noise Reduction',
    category: 'Correction',
    icon: '🔇',
    defaultParams: [
      { id: 'reduction', name: 'Reduction (dB)', type: 'range', value: 12, defaultValue: 12, min: 0, max: 40, step: 1 },
    ],
  },
];

// Comprehensive transitions like Adobe Premiere Pro
const transitions: (TransitionPreset & { type: TransitionType; description: string })[] = [
  // Dissolve Transitions
  { id: 'cross-dissolve', type: 'cross-dissolve', name: 'Cross Dissolve', category: 'Dissolve', icon: '◐', defaultDuration: 1, defaultParams: [], description: 'Smooth blend between clips' },
  { id: 'dip-to-black', type: 'dip-to-black', name: 'Dip to Black', category: 'Dissolve', icon: '◑', defaultDuration: 1, defaultParams: [], description: 'Fade through black' },
  { id: 'dip-to-white', type: 'dip-to-white', name: 'Dip to White', category: 'Dissolve', icon: '◒', defaultDuration: 1, defaultParams: [], description: 'Fade through white' },
  { id: 'film-dissolve', type: 'film-dissolve', name: 'Film Dissolve', category: 'Dissolve', icon: '◓', defaultDuration: 1, defaultParams: [], description: 'Cinematic dissolve' },
  { id: 'additive-dissolve', type: 'additive-dissolve', name: 'Additive Dissolve', category: 'Dissolve', icon: '◔', defaultDuration: 1, defaultParams: [], description: 'Bright additive blend' },
  { id: 'blur-dissolve', type: 'blur-dissolve', name: 'Blur Dissolve', category: 'Dissolve', icon: '◕', defaultDuration: 1.5, defaultParams: [], description: 'Dissolve with blur' },
  { id: 'morph', type: 'morph', name: 'Morph', category: 'Dissolve', icon: '∞', defaultDuration: 1.5, defaultParams: [], description: 'Morphing transition' },
  { id: 'glitch', type: 'glitch', name: 'Glitch', category: 'Dissolve', icon: '⚡', defaultDuration: 0.5, defaultParams: [], description: 'Digital glitch effect' },

  // Wipe Transitions
  { id: 'wipe-left', type: 'wipe-left', name: 'Wipe Left', category: 'Wipe', icon: '◀', defaultDuration: 0.75, defaultParams: [], description: 'Wipe from right to left' },
  { id: 'wipe-right', type: 'wipe-right', name: 'Wipe Right', category: 'Wipe', icon: '▶', defaultDuration: 0.75, defaultParams: [], description: 'Wipe from left to right' },
  { id: 'wipe-up', type: 'wipe-up', name: 'Wipe Up', category: 'Wipe', icon: '▲', defaultDuration: 0.75, defaultParams: [], description: 'Wipe from bottom to top' },
  { id: 'wipe-down', type: 'wipe-down', name: 'Wipe Down', category: 'Wipe', icon: '▼', defaultDuration: 0.75, defaultParams: [], description: 'Wipe from top to bottom' },
  { id: 'wipe-diagonal', type: 'wipe-diagonal', name: 'Diagonal Wipe', category: 'Wipe', icon: '◢', defaultDuration: 0.75, defaultParams: [], description: 'Diagonal corner wipe' },
  { id: 'wipe-clock', type: 'wipe-clock', name: 'Clock Wipe', category: 'Wipe', icon: '⟳', defaultDuration: 1, defaultParams: [], description: 'Clockwise circular wipe' },
  { id: 'wipe-radial', type: 'wipe-radial', name: 'Radial Wipe', category: 'Wipe', icon: '⊙', defaultDuration: 1, defaultParams: [], description: 'Radial outward wipe' },
  { id: 'barn-doors', type: 'barn-doors', name: 'Barn Doors', category: 'Wipe', icon: '⟺', defaultDuration: 0.75, defaultParams: [], description: 'Split from center' },
  { id: 'split', type: 'split', name: 'Split', category: 'Wipe', icon: '⫿', defaultDuration: 0.75, defaultParams: [], description: 'Vertical split reveal' },

  // Slide Transitions
  { id: 'push-left', type: 'push-left', name: 'Push Left', category: 'Slide', icon: '⇐', defaultDuration: 0.5, defaultParams: [], description: 'Push clip off to left' },
  { id: 'push-right', type: 'push-right', name: 'Push Right', category: 'Slide', icon: '⇒', defaultDuration: 0.5, defaultParams: [], description: 'Push clip off to right' },
  { id: 'push-up', type: 'push-up', name: 'Push Up', category: 'Slide', icon: '⇑', defaultDuration: 0.5, defaultParams: [], description: 'Push clip off upward' },
  { id: 'push-down', type: 'push-down', name: 'Push Down', category: 'Slide', icon: '⇓', defaultDuration: 0.5, defaultParams: [], description: 'Push clip off downward' },
  { id: 'slide-left', type: 'slide-left', name: 'Slide Left', category: 'Slide', icon: '←', defaultDuration: 0.5, defaultParams: [], description: 'Slide over from right' },
  { id: 'slide-right', type: 'slide-right', name: 'Slide Right', category: 'Slide', icon: '→', defaultDuration: 0.5, defaultParams: [], description: 'Slide over from left' },
  { id: 'slide-up', type: 'slide-up', name: 'Slide Up', category: 'Slide', icon: '↑', defaultDuration: 0.5, defaultParams: [], description: 'Slide over from bottom' },
  { id: 'slide-down', type: 'slide-down', name: 'Slide Down', category: 'Slide', icon: '↓', defaultDuration: 0.5, defaultParams: [], description: 'Slide over from top' },

  // Zoom Transitions
  { id: 'zoom-in', type: 'zoom-in', name: 'Zoom In', category: 'Zoom', icon: '⊕', defaultDuration: 0.75, defaultParams: [], description: 'Zoom into next clip' },
  { id: 'zoom-out', type: 'zoom-out', name: 'Zoom Out', category: 'Zoom', icon: '⊖', defaultDuration: 0.75, defaultParams: [], description: 'Zoom out to next clip' },
  { id: 'zoom-cross', type: 'zoom-cross', name: 'Cross Zoom', category: 'Zoom', icon: '⊗', defaultDuration: 1, defaultParams: [], description: 'Zoom through transition' },
  { id: 'cross-stretch', type: 'cross-stretch', name: 'Cross Stretch', category: 'Zoom', icon: '⤢', defaultDuration: 0.75, defaultParams: [], description: 'Stretch and cross fade' },

  // Iris Transitions
  { id: 'iris-circle', type: 'iris-circle', name: 'Iris Circle', category: 'Iris', icon: '○', defaultDuration: 0.75, defaultParams: [], description: 'Circular iris reveal' },
  { id: 'iris-diamond', type: 'iris-diamond', name: 'Iris Diamond', category: 'Iris', icon: '◇', defaultDuration: 0.75, defaultParams: [], description: 'Diamond shape reveal' },
  { id: 'iris-square', type: 'iris-square', name: 'Iris Square', category: 'Iris', icon: '□', defaultDuration: 0.75, defaultParams: [], description: 'Square shape reveal' },
  { id: 'iris-star', type: 'iris-star', name: 'Iris Star', category: 'Iris', icon: '☆', defaultDuration: 0.75, defaultParams: [], description: 'Star shape reveal' },
  { id: 'iris-heart', type: 'iris-heart', name: 'Iris Heart', category: 'Iris', icon: '♡', defaultDuration: 0.75, defaultParams: [], description: 'Heart shape reveal' },

  // 3D Motion Transitions
  { id: 'flip-horizontal', type: 'flip-horizontal', name: 'Flip H', category: '3D Motion', icon: '⇄', defaultDuration: 0.75, defaultParams: [], description: '3D horizontal flip' },
  { id: 'flip-vertical', type: 'flip-vertical', name: 'Flip V', category: '3D Motion', icon: '⇅', defaultDuration: 0.75, defaultParams: [], description: '3D vertical flip' },
  { id: 'cube-spin', type: 'cube-spin', name: 'Cube Spin', category: '3D Motion', icon: '⬡', defaultDuration: 1, defaultParams: [], description: '3D cube rotation' },

  // Page Transitions
  { id: 'page-peel', type: 'page-peel', name: 'Page Peel', category: 'Page', icon: '⤴', defaultDuration: 1, defaultParams: [], description: 'Page peel effect' },
  { id: 'page-curl', type: 'page-curl', name: 'Page Curl', category: 'Page', icon: '⤵', defaultDuration: 1, defaultParams: [], description: 'Page curl effect' },

  // Audio Transitions
  { id: 'crossfade-constant-gain', type: 'crossfade-constant-gain', name: 'Constant Gain', category: 'Audio Crossfade', icon: '🔊', defaultDuration: 1, defaultParams: [], description: 'Linear audio crossfade' },
  { id: 'crossfade-constant-power', type: 'crossfade-constant-power', name: 'Constant Power', category: 'Audio Crossfade', icon: '🔉', defaultDuration: 1, defaultParams: [], description: 'Logarithmic crossfade' },
  { id: 'exponential-fade', type: 'exponential-fade', name: 'Exponential', category: 'Audio Crossfade', icon: '🔈', defaultDuration: 1, defaultParams: [], description: 'Exponential audio fade' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Dissolve': '#8b5cf6',
  'Wipe': '#3b82f6',
  'Slide': '#10b981',
  'Zoom': '#f59e0b',
  'Iris': '#ec4899',
  '3D Motion': '#06b6d4',
  'Page': '#84cc16',
  'Audio Crossfade': '#ef4444',
};

const EffectsPanel: React.FC<EffectsPanelProps> = ({ selectedClip, onApplyEffect, onApplyTransition }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'transitions'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Dissolve', 'Wipe']);
  const [defaultTransitionDuration, setDefaultTransitionDuration] = useState(1.0);

  const handleTransitionDragStart = useCallback((e: React.DragEvent, transition: typeof transitions[0]) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'transition',
      transitionId: transition.type,
      transitionName: transition.name,
      category: transition.category,
      duration: defaultTransitionDuration,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, [defaultTransitionDuration]);

  const handleTransitionDoubleClick = useCallback((transition: typeof transitions[0]) => {
    if (selectedClip && onApplyTransition) {
      onApplyTransition(selectedClip.id, transition.type, defaultTransitionDuration, 'in');
    }
  }, [selectedClip, onApplyTransition, defaultTransitionDuration]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const getEffectsByCategory = (effects: EffectPreset[]) => {
    const filtered = effects.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const categories: { [key: string]: EffectPreset[] } = {};
    for (const effect of filtered) {
      if (!categories[effect.category]) {
        categories[effect.category] = [];
      }
      categories[effect.category].push(effect);
    }
    return categories;
  };

  const renderEffects = (effects: EffectPreset[]) => {
    const categories = getEffectsByCategory(effects);

    return Object.entries(categories).map(([category, categoryEffects]) => (
      <div key={category} className="border-b border-editor-border">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-editor-panel"
          onClick={() => toggleCategory(category)}
        >
          <span>{category}</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              expandedCategories.includes(category) ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
        {expandedCategories.includes(category) && (
          <div className="px-2 pb-2 space-y-1">
            {categoryEffects.map((effect) => (
              <div
                key={effect.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-editor-panel"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('effect', JSON.stringify(effect));
                }}
                onDoubleClick={() => onApplyEffect(effect)}
              >
                <span className="text-lg">{effect.icon}</span>
                <span>{effect.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const renderTransitions = () => {
    // Filter transitions based on clip type
    const filteredByType = selectedClip?.type === 'audio'
      ? transitions.filter((t) => t.category === 'Audio Crossfade')
      : selectedClip?.type === 'video' || selectedClip?.type === 'image'
        ? transitions.filter((t) => t.category !== 'Audio Crossfade')
        : transitions;

    const filtered = filteredByType.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories: { [key: string]: typeof transitions } = {};
    for (const transition of filtered) {
      if (!categories[transition.category]) {
        categories[transition.category] = [];
      }
      categories[transition.category].push(transition);
    }

    return (
      <>
        {/* Duration Setting */}
        <div className="p-2 border-b border-editor-border flex items-center gap-2">
          <span className="text-xs text-editor-text-secondary">Duration:</span>
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={defaultTransitionDuration}
            onChange={(e) => setDefaultTransitionDuration(parseFloat(e.target.value) || 1.0)}
            className="w-14 h-6 px-1 bg-editor-panel border border-editor-border rounded text-xs text-right focus:outline-none focus:border-editor-accent"
          />
          <span className="text-xs text-editor-text-secondary">sec</span>
        </div>

        {/* Instructions */}
        <div className="p-2 bg-editor-bg/50 text-xs text-editor-text-secondary border-b border-editor-border">
          Drag to timeline or double-click to apply
        </div>

        {Object.entries(categories).map(([category, categoryTransitions]) => (
          <div key={category} className="border-b border-editor-border">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-editor-panel"
              onClick={() => toggleCategory(category)}
            >
              <span
                className="text-xs transition-transform"
                style={{
                  transform: expandedCategories.includes(category) ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                ▶
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#666' }}
              />
              <span className="font-medium">{category}</span>
              <span className="ml-auto text-xs text-editor-text-secondary">
                {categoryTransitions.length}
              </span>
            </button>
            {expandedCategories.includes(category) && (
              <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                {categoryTransitions.map((transition) => (
                  <div
                    key={transition.id}
                    className="flex items-center gap-2 p-2 rounded text-xs cursor-grab active:cursor-grabbing hover:bg-editor-panel border border-transparent hover:border-editor-accent transition-colors"
                    draggable
                    onDragStart={(e) => handleTransitionDragStart(e, transition)}
                    onDoubleClick={() => handleTransitionDoubleClick(transition)}
                    title={transition.description}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-sm flex-shrink-0"
                      style={{
                        backgroundColor: (CATEGORY_COLORS[category] || '#666') + '20',
                        color: CATEGORY_COLORS[category] || '#666',
                      }}
                    >
                      {transition.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{transition.name}</div>
                      <div className="text-editor-text-secondary">{transition.defaultDuration}s</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Effects</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-editor-border">
        {(['video', 'audio', 'transitions'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize ${
              activeTab === tab
                ? 'text-editor-accent border-b-2 border-editor-accent'
                : 'text-editor-text-secondary hover:text-editor-text'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-2 border-b border-editor-border">
        <input
          type="text"
          placeholder="Search effects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
        />
      </div>

      {/* Effects list */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'video' && renderEffects(videoEffects)}
        {activeTab === 'audio' && renderEffects(audioEffects)}
        {activeTab === 'transitions' && renderTransitions()}
      </div>

      {/* Clip effects */}
      {selectedClip && selectedClip.effects.length > 0 && (
        <div className="border-t border-editor-border p-2">
          <div className="text-xs font-medium mb-2">Applied Effects</div>
          <div className="space-y-1">
            {selectedClip.effects.map((effect) => (
              <div
                key={effect.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-editor-panel"
              >
                <span className="text-xs">{effect.name}</span>
                <button className="text-xs text-red-400 hover:text-red-300">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EffectsPanel;
