import React, { useState } from 'react';
import { Sequence, ExportSettings } from '../../types';

interface ExportDialogProps {
  sequence: Sequence | null;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

const presets = [
  { name: 'YouTube 1080p', format: 'mp4', codec: 'h264', width: 1920, height: 1080, frameRate: 30, bitrate: 15000, quality: 'high' },
  { name: 'YouTube 4K', format: 'mp4', codec: 'h264', width: 3840, height: 2160, frameRate: 30, bitrate: 45000, quality: 'ultra' },
  { name: 'Instagram Reels', format: 'mp4', codec: 'h264', width: 1080, height: 1920, frameRate: 30, bitrate: 10000, quality: 'high' },
  { name: 'TikTok', format: 'mp4', codec: 'h264', width: 1080, height: 1920, frameRate: 30, bitrate: 8000, quality: 'medium' },
  { name: 'Twitter', format: 'mp4', codec: 'h264', width: 1280, height: 720, frameRate: 30, bitrate: 5000, quality: 'medium' },
  { name: 'Web (WebM)', format: 'webm', codec: 'vp9', width: 1920, height: 1080, frameRate: 30, bitrate: 10000, quality: 'high' },
  { name: 'GIF', format: 'gif', codec: 'gif', width: 480, height: 270, frameRate: 15, bitrate: 0, quality: 'medium' },
  { name: 'ProRes 422', format: 'mov', codec: 'prores', width: 1920, height: 1080, frameRate: 30, bitrate: 100000, quality: 'ultra' },
] as const;

const ExportDialog: React.FC<ExportDialogProps> = ({ sequence, onClose, onExport }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    codec: 'h264',
    width: sequence?.width || 1920,
    height: sequence?.height || 1080,
    frameRate: sequence?.frameRate || 30,
    bitrate: 15000,
    quality: 'high',
    audioCodec: 'aac',
    audioBitrate: 320,
    outputPath: '',
    range: 'full',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const applyPreset = (preset: typeof presets[number]) => {
    setSettings((prev) => ({
      ...prev,
      format: preset.format as ExportSettings['format'],
      codec: preset.codec,
      width: preset.width,
      height: preset.height,
      frameRate: preset.frameRate,
      bitrate: preset.bitrate,
      quality: preset.quality as ExportSettings['quality'],
    }));
  };

  const handleExport = async () => {
    if (!settings.outputPath) {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Export Video',
        filters: [
          { name: 'Video Files', extensions: [settings.format] },
        ],
        defaultPath: `${sequence?.name || 'export'}.${settings.format}`,
      });

      if (result.canceled || !result.filePath) return;
      setSettings((prev) => ({ ...prev, outputPath: result.filePath }));
    }

    setIsExporting(true);

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          onExport(settings);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  const estimateFileSize = (): string => {
    const duration = sequence?.duration || 0;
    const videoBits = settings.bitrate * 1000 * duration;
    const audioBits = settings.audioBitrate * 1000 * duration;
    const totalBytes = (videoBits + audioBits) / 8;

    if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    }
    if (totalBytes < 1024 * 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface rounded-lg shadow-2xl w-[700px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-lg font-medium">Export Media</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {isExporting ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg mb-2">Exporting...</p>
                <p className="text-sm text-editor-text-secondary">
                  {sequence?.name || 'Untitled'}.{settings.format}
                </p>
              </div>
              <div className="w-full h-2 bg-editor-border rounded overflow-hidden">
                <div
                  className="h-full bg-editor-accent transition-all"
                  style={{ width: `${Math.min(exportProgress, 100)}%` }}
                />
              </div>
              <p className="text-center text-sm text-editor-text-secondary">
                {Math.round(exportProgress)}% complete
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                {/* Presets */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        className="px-3 py-2 text-xs text-left rounded border border-editor-border hover:border-editor-accent transition-colors"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Format</h3>
                  <select
                    value={settings.format}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        format: e.target.value as ExportSettings['format'],
                      }))
                    }
                    className="w-full h-8 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                  >
                    <option value="mp4">MP4 (H.264)</option>
                    <option value="mov">QuickTime (ProRes)</option>
                    <option value="webm">WebM (VP9)</option>
                    <option value="avi">AVI</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>

                {/* Quality */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Quality</h3>
                  <select
                    value={settings.quality}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        quality: e.target.value as ExportSettings['quality'],
                      }))
                    }
                    className="w-full h-8 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                  >
                    <option value="low">Low (Fast export)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra (Slow export)</option>
                  </select>
                </div>

                {/* Range */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Range</h3>
                  <select
                    value={settings.range}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        range: e.target.value as ExportSettings['range'],
                      }))
                    }
                    className="w-full h-8 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                  >
                    <option value="full">Entire Sequence</option>
                    <option value="inout">In/Out Points</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Video */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Video Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-editor-text-secondary w-20">Resolution</label>
                      <input
                        type="number"
                        value={settings.width}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, width: parseInt(e.target.value) }))
                        }
                        className="w-20 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      />
                      <span className="text-sm">×</span>
                      <input
                        type="number"
                        value={settings.height}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, height: parseInt(e.target.value) }))
                        }
                        className="w-20 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-editor-text-secondary w-20">Frame Rate</label>
                      <select
                        value={settings.frameRate}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, frameRate: parseInt(e.target.value) }))
                        }
                        className="flex-1 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      >
                        <option value="24">24 fps</option>
                        <option value="25">25 fps</option>
                        <option value="30">30 fps</option>
                        <option value="50">50 fps</option>
                        <option value="60">60 fps</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-editor-text-secondary w-20">Bitrate</label>
                      <input
                        type="number"
                        value={settings.bitrate}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, bitrate: parseInt(e.target.value) }))
                        }
                        className="flex-1 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      />
                      <span className="text-xs text-editor-text-secondary">kbps</span>
                    </div>
                  </div>
                </div>

                {/* Audio */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Audio Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-editor-text-secondary w-20">Codec</label>
                      <select
                        value={settings.audioCodec}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, audioCodec: e.target.value }))
                        }
                        className="flex-1 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      >
                        <option value="aac">AAC</option>
                        <option value="mp3">MP3</option>
                        <option value="pcm">PCM (Uncompressed)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-editor-text-secondary w-20">Bitrate</label>
                      <select
                        value={settings.audioBitrate}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, audioBitrate: parseInt(e.target.value) }))
                        }
                        className="flex-1 h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm"
                      >
                        <option value="128">128 kbps</option>
                        <option value="192">192 kbps</option>
                        <option value="256">256 kbps</option>
                        <option value="320">320 kbps</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3 bg-editor-panel rounded space-y-1">
                  <h3 className="text-sm font-medium mb-2">Export Summary</h3>
                  <div className="flex justify-between text-xs">
                    <span className="text-editor-text-secondary">Output</span>
                    <span>
                      {settings.width}×{settings.height} @ {settings.frameRate}fps
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-editor-text-secondary">Estimated Size</span>
                    <span>{estimateFileSize()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-editor-text-secondary">Duration</span>
                    <span>
                      {Math.floor((sequence?.duration || 0) / 60)}:
                      {Math.floor((sequence?.duration || 0) % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-editor-border">
            <button
              className="px-4 h-8 rounded text-sm hover:bg-editor-border transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 h-8 bg-editor-accent rounded text-sm hover:bg-editor-accent-hover transition-colors"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportDialog;
