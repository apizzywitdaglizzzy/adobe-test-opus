import React, { useRef, useEffect, useState } from 'react';
import { Sequence, MediaItem } from '../../types';

interface PreviewProps {
  sequence: Sequence | null;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onTimeChange: (time: number) => void;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  mediaItems: MediaItem[];
}

const Preview: React.FC<PreviewProps> = ({
  sequence,
  currentTime,
  isPlaying,
  onPlayPause,
  onStop,
  onTimeChange,
  onPrevFrame,
  onNextFrame,
  onGoToStart,
  onGoToEnd,
  mediaItems,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * (sequence?.frameRate || 30));
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && sequence) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight - 80; // Account for controls
        const aspectRatio = sequence.width / sequence.height;

        let width = containerWidth;
        let height = width / aspectRatio;

        if (height > containerHeight) {
          height = containerHeight;
          width = height * aspectRatio;
        }

        setPreviewSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sequence]);

  useEffect(() => {
    if (!canvasRef.current || !sequence) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render current frame
    const videoTracks = sequence.tracks.filter((t) => t.type === 'video');

    // Find active clips at current time
    for (const track of videoTracks) {
      for (const clip of track.clips) {
        if (!clip.enabled) continue;
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          const media = mediaItems.find((m) => m.id === clip.mediaId);
          if (media) {
            // Draw placeholder for now
            ctx.fillStyle = clip.color || '#4a9eff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw clip name
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(clip.name, canvas.width / 2, canvas.height / 2);

            // Draw timecode
            const clipTime = (currentTime - clip.startTime) * clip.speed + clip.inPoint;
            ctx.font = '14px monospace';
            ctx.fillText(formatTime(clipTime), canvas.width / 2, canvas.height / 2 + 40);
          }
          break;
        }
      }
    }
  }, [currentTime, sequence, mediaItems]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const duration = sequence?.duration || 0;
    onTimeChange(percentage * duration);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!sequence) {
    return (
      <div className="h-full flex items-center justify-center bg-editor-panel text-editor-text-secondary">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
          <p className="text-lg">No sequence loaded</p>
          <p className="text-sm mt-1">Create or select a sequence to preview</p>
        </div>
      </div>
    );
  }

  const duration = sequence.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
    >
      {/* Preview canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={sequence.width}
          height={sequence.height}
          style={{
            width: previewSize.width,
            height: previewSize.height,
          }}
          className="bg-black shadow-2xl"
        />
      </div>

      {/* Controls */}
      <div
        className={`bg-editor-surface border-t border-editor-border transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-editor-border cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-editor-accent"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={onGoToStart}
              title="Go to Start (Home)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={onPrevFrame}
              title="Previous Frame (←)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-editor-accent hover:bg-editor-accent-hover transition-colors"
              onClick={onPlayPause}
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={onStop}
              title="Stop (Enter)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={onNextFrame}
              title="Next Frame (→)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={onGoToEnd}
              title="Go to End (End)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Timecode */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Playback rate */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="h-7 px-2 bg-editor-panel border border-editor-border rounded text-xs"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            {/* Volume */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />

            {/* Fullscreen */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-editor-border transition-colors"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
