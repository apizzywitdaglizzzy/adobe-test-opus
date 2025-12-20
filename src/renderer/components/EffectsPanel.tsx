import React, { useState } from 'react';
import { Clip, Effect, EffectPreset, TransitionPreset } from '../../types';

interface EffectsPanelProps {
  selectedClip: Clip | null;
  onApplyEffect: (effect: EffectPreset) => void;
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

const transitions: TransitionPreset[] = [
  { id: 'dissolve', name: 'Cross Dissolve', category: 'Dissolve', icon: '◐', defaultDuration: 1, defaultParams: [] },
  { id: 'dip-black', name: 'Dip to Black', category: 'Dissolve', icon: '■', defaultDuration: 1, defaultParams: [] },
  { id: 'dip-white', name: 'Dip to White', category: 'Dissolve', icon: '□', defaultDuration: 1, defaultParams: [] },
  { id: 'wipe-left', name: 'Wipe Left', category: 'Wipe', icon: '←', defaultDuration: 1, defaultParams: [] },
  { id: 'wipe-right', name: 'Wipe Right', category: 'Wipe', icon: '→', defaultDuration: 1, defaultParams: [] },
  { id: 'wipe-up', name: 'Wipe Up', category: 'Wipe', icon: '↑', defaultDuration: 1, defaultParams: [] },
  { id: 'wipe-down', name: 'Wipe Down', category: 'Wipe', icon: '↓', defaultDuration: 1, defaultParams: [] },
  { id: 'slide-left', name: 'Slide Left', category: 'Slide', icon: '⇐', defaultDuration: 1, defaultParams: [] },
  { id: 'slide-right', name: 'Slide Right', category: 'Slide', icon: '⇒', defaultDuration: 1, defaultParams: [] },
  { id: 'zoom-in', name: 'Zoom In', category: 'Zoom', icon: '⊕', defaultDuration: 1, defaultParams: [] },
  { id: 'zoom-out', name: 'Zoom Out', category: 'Zoom', icon: '⊖', defaultDuration: 1, defaultParams: [] },
];

const EffectsPanel: React.FC<EffectsPanelProps> = ({ selectedClip, onApplyEffect }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'transitions'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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
    const categories: { [key: string]: TransitionPreset[] } = {};
    const filtered = transitions.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    for (const transition of filtered) {
      if (!categories[transition.category]) {
        categories[transition.category] = [];
      }
      categories[transition.category].push(transition);
    }

    return Object.entries(categories).map(([category, categoryTransitions]) => (
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
          <div className="grid grid-cols-2 gap-1 px-2 pb-2">
            {categoryTransitions.map((transition) => (
              <div
                key={transition.id}
                className="flex flex-col items-center gap-1 p-2 rounded text-xs cursor-pointer hover:bg-editor-panel"
                draggable
              >
                <div className="w-12 h-8 bg-editor-border rounded flex items-center justify-center text-lg">
                  {transition.icon}
                </div>
                <span className="text-center">{transition.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
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
