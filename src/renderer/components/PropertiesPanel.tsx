import React, { useState } from 'react';
import { Clip, MediaItem, Sequence, Effect } from '../../types';

interface PropertiesPanelProps {
  selectedClip: Clip | null;
  selectedMedia: MediaItem | null;
  sequence: Sequence | null;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedClip,
  selectedMedia,
  sequence,
  onClipUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'clip' | 'effect' | 'motion'>('clip');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * (sequence?.frameRate || 30));
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const renderClipProperties = () => {
    if (!selectedClip) {
      return (
        <div className="flex items-center justify-center h-full text-editor-text-secondary text-sm">
          Select a clip to view properties
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Clip Info</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-editor-text-secondary">Name</span>
              <input
                type="text"
                value={selectedClip.name}
                onChange={(e) => onClipUpdate(selectedClip.id, { name: e.target.value })}
                className="w-32 h-6 px-2 bg-editor-panel border border-editor-border rounded text-right text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-editor-text-secondary">Type</span>
              <span className="capitalize">{selectedClip.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-editor-text-secondary">Start</span>
              <span>{formatTime(selectedClip.startTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-editor-text-secondary">Duration</span>
              <span>{formatTime(selectedClip.duration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-editor-text-secondary">End</span>
              <span>{formatTime(selectedClip.startTime + selectedClip.duration)}</span>
            </div>
          </div>
        </div>

        {/* Speed & Time */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Speed & Time</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-editor-text-secondary">Speed</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={selectedClip.speed * 100}
                  onChange={(e) =>
                    onClipUpdate(selectedClip.id, { speed: parseFloat(e.target.value) / 100 })
                  }
                  step="10"
                  min="10"
                  max="1000"
                  className="w-16 h-6 px-2 bg-editor-panel border border-editor-border rounded text-right text-sm focus:outline-none focus:border-editor-accent"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-editor-text-secondary">In Point</span>
              <span className="text-sm">{formatTime(selectedClip.inPoint)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-editor-text-secondary">Out Point</span>
              <span className="text-sm">{formatTime(selectedClip.outPoint)}</span>
            </div>
          </div>
        </div>

        {/* Audio */}
        {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Audio</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-editor-text-secondary">Volume</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={selectedClip.volume}
                    onChange={(e) =>
                      onClipUpdate(selectedClip.id, { volume: parseFloat(e.target.value) })
                    }
                    className="w-20"
                  />
                  <span className="text-sm w-12 text-right">
                    {Math.round(selectedClip.volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video */}
        {selectedClip.type === 'video' && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Video</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-editor-text-secondary">Opacity</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedClip.opacity}
                    onChange={(e) =>
                      onClipUpdate(selectedClip.id, { opacity: parseFloat(e.target.value) })
                    }
                    className="w-20"
                  />
                  <span className="text-sm w-12 text-right">
                    {Math.round(selectedClip.opacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Status</h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-editor-text-secondary">Enabled</span>
              <input
                type="checkbox"
                checked={selectedClip.enabled}
                onChange={(e) => onClipUpdate(selectedClip.id, { enabled: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-editor-text-secondary">Locked</span>
              <input
                type="checkbox"
                checked={selectedClip.locked}
                onChange={(e) => onClipUpdate(selectedClip.id, { locked: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-editor-text-secondary">Color</span>
            <input
              type="color"
              value={selectedClip.color}
              onChange={(e) => onClipUpdate(selectedClip.id, { color: e.target.value })}
              className="w-8 h-6 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMotionProperties = () => {
    if (!selectedClip || selectedClip.type === 'audio') {
      return (
        <div className="flex items-center justify-center h-full text-editor-text-secondary text-sm">
          Select a video clip to view motion properties
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Position</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-editor-text-secondary">X</label>
              <input
                type="number"
                defaultValue={0}
                className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
            <div>
              <label className="text-xs text-editor-text-secondary">Y</label>
              <input
                type="number"
                defaultValue={0}
                className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Scale</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-editor-text-secondary">Uniform</span>
              <input
                type="number"
                defaultValue={100}
                step="1"
                min="0"
                max="1000"
                className="w-20 h-6 px-2 bg-editor-panel border border-editor-border rounded text-right text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-editor-text-secondary">Width</label>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
                />
              </div>
              <div>
                <label className="text-xs text-editor-text-secondary">Height</label>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Rotation</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-editor-text-secondary">Angle</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={0}
                step="1"
                className="w-16 h-6 px-2 bg-editor-panel border border-editor-border rounded text-right text-sm focus:outline-none focus:border-editor-accent"
              />
              <span className="text-sm">°</span>
            </div>
          </div>
        </div>

        {/* Anchor Point */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Anchor Point</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-editor-text-secondary">X</label>
              <input
                type="number"
                defaultValue={sequence?.width ? sequence.width / 2 : 960}
                className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
            <div>
              <label className="text-xs text-editor-text-secondary">Y</label>
              <input
                type="number"
                defaultValue={sequence?.height ? sequence.height / 2 : 540}
                className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEffectProperties = () => {
    if (!selectedClip) {
      return (
        <div className="flex items-center justify-center h-full text-editor-text-secondary text-sm">
          Select a clip to view effect properties
        </div>
      );
    }

    if (selectedClip.effects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-editor-text-secondary text-sm">
          <p>No effects applied</p>
          <p className="text-xs mt-1">Drag effects from the Effects panel</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {selectedClip.effects.map((effect) => (
          <div key={effect.id} className="bg-editor-panel rounded overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-editor-border">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={effect.enabled}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{effect.name}</span>
              </div>
              <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
            </div>
            <div className="p-3 space-y-2">
              {effect.parameters.map((param) => (
                <div key={param.id} className="flex items-center justify-between">
                  <span className="text-sm text-editor-text-secondary">{param.name}</span>
                  {param.type === 'range' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={param.value as number}
                        className="w-16"
                      />
                      <input
                        type="number"
                        value={param.value as number}
                        className="w-14 h-6 px-1 bg-editor-bg border border-editor-border rounded text-right text-xs"
                      />
                    </div>
                  )}
                  {param.type === 'boolean' && (
                    <input type="checkbox" checked={param.value as boolean} className="w-4 h-4" />
                  )}
                  {param.type === 'color' && (
                    <input
                      type="color"
                      value={param.value as string}
                      className="w-8 h-6 rounded cursor-pointer"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMediaInfo = () => {
    if (!selectedMedia) {
      return null;
    }

    return (
      <div className="space-y-4 mt-4 pt-4 border-t border-editor-border">
        <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Source Media Info</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-editor-text-secondary">File</span>
            <span className="truncate max-w-[150px]" title={selectedMedia.name}>
              {selectedMedia.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-editor-text-secondary">Type</span>
            <span className="capitalize">{selectedMedia.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-editor-text-secondary">Duration</span>
            <span>{formatTime(selectedMedia.duration)}</span>
          </div>
          {selectedMedia.width && selectedMedia.height && (
            <div className="flex justify-between">
              <span className="text-editor-text-secondary">Resolution</span>
              <span>
                {selectedMedia.width} x {selectedMedia.height}
              </span>
            </div>
          )}
          {selectedMedia.frameRate && (
            <div className="flex justify-between">
              <span className="text-editor-text-secondary">Frame Rate</span>
              <span>{selectedMedia.frameRate} fps</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-editor-text-secondary">Size</span>
            <span>{formatFileSize(selectedMedia.size)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Properties</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-editor-border">
        {(['clip', 'effect', 'motion'] as const).map((tab) => (
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'clip' && (
          <>
            {renderClipProperties()}
            {renderMediaInfo()}
          </>
        )}
        {activeTab === 'effect' && renderEffectProperties()}
        {activeTab === 'motion' && renderMotionProperties()}
      </div>
    </div>
  );
};

export default PropertiesPanel;
