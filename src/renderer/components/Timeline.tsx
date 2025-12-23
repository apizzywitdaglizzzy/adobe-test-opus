import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Sequence, Track, Clip, MediaItem, EditorState, Transition } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface TimelineProps {
  sequence: Sequence | null;
  currentTime: number;
  zoom: number;
  tool: EditorState['tool'];
  snapping: boolean;
  showWaveforms: boolean;
  showThumbnails: boolean;
  selectedClips: string[];
  onTimeChange: (time: number) => void;
  onSelectClips: (ids: string[]) => void;
  onClipMove: (clipId: string, newStartTime: number, newTrackId: string) => void;
  onClipResize: (clipId: string, newStartTime: number, newDuration: number, edge: 'left' | 'right') => void;
  onZoomChange: (zoom: number) => void;
  onAddTrack: (type: 'video' | 'audio' | 'subtitle') => void;
  onSplitClip: () => void;
  mediaItems: MediaItem[];
  onApplyTransition?: (clipId: string, transition: Transition, position: 'in' | 'out') => void;
}

const PIXELS_PER_SECOND = 100;
const TRACK_HEADER_WIDTH = 150;

// Transition color mapping
const TRANSITION_COLORS: Record<string, string> = {
  dissolve: '#8b5cf6',
  wipe: '#3b82f6',
  slide: '#10b981',
  zoom: '#f59e0b',
  iris: '#ec4899',
  '3d': '#06b6d4',
  page: '#84cc16',
  audio: '#ef4444',
};

const Timeline: React.FC<TimelineProps> = ({
  sequence,
  currentTime,
  zoom,
  tool,
  snapping,
  showWaveforms,
  showThumbnails,
  selectedClips,
  onTimeChange,
  onSelectClips,
  onClipMove,
  onClipResize,
  onZoomChange,
  onAddTrack,
  onSplitClip,
  mediaItems,
  onApplyTransition,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'clip' | 'resize-left' | 'resize-right' | null>(null);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dropTargetClip, setDropTargetClip] = useState<{ clipId: string; position: 'in' | 'out' } | null>(null);

  const pixelsPerSecond = PIXELS_PER_SECOND * zoom;

  // Calculate actual content duration from clips
  const contentDuration = sequence?.tracks.reduce((maxEnd, track) => {
    const trackEnd = track.clips.reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 0);
    return Math.max(maxEnd, trackEnd);
  }, 0) || 0;

  // Timeline always extends beyond content - minimum 60 seconds or content + 60 seconds buffer
  const duration = Math.max(60, contentDuration + 60, sequence?.duration || 0);
  const timelineWidth = duration * pixelsPerSecond;

  const timeToPixels = (time: number) => time * pixelsPerSecond;
  const pixelsToTime = (pixels: number) => pixels / pixelsPerSecond;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * (sequence?.frameRate || 30));
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (tool === 'razor') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_HEADER_WIDTH + scrollLeft;
    const time = Math.max(0, pixelsToTime(x));
    onTimeChange(time);
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType('playhead');
    setDragStartX(e.clientX);
    setDragStartTime(currentTime);
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();

    if (tool === 'razor') {
      onSplitClip();
      return;
    }

    if (!selectedClips.includes(clip.id)) {
      if (e.ctrlKey || e.metaKey) {
        onSelectClips([...selectedClips, clip.id]);
      } else {
        onSelectClips([clip.id]);
      }
    }

    setIsDragging(true);
    setDragType(type === 'move' ? 'clip' : type);
    setDragClipId(clip.id);
    setDragStartX(e.clientX);
    setDragStartTime(type === 'resize-right' ? clip.duration : clip.startTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelsToTime(deltaX);

      if (dragType === 'playhead') {
        const newTime = Math.max(0, dragStartTime + deltaTime);
        onTimeChange(snapping ? Math.round(newTime * 10) / 10 : newTime);
      } else if (dragType === 'clip' && dragClipId) {
        const newStartTime = Math.max(0, dragStartTime + deltaTime);
        const clip = sequence?.tracks.flatMap((t) => t.clips).find((c) => c.id === dragClipId);
        if (clip) {
          // Calculate which track the mouse is over
          const tracksContainer = tracksContainerRef.current;
          if (tracksContainer) {
            const containerRect = tracksContainer.getBoundingClientRect();
            const mouseY = e.clientY - containerRect.top + tracksContainer.scrollTop;

            // Find which track the mouse is over
            let accumulatedHeight = 0;
            let targetTrackId = clip.trackId;

            for (const track of sequence?.tracks || []) {
              const trackHeight = track.height + 8; // Include button row height
              if (mouseY >= accumulatedHeight && mouseY < accumulatedHeight + trackHeight) {
                // Check if track types are compatible
                if ((clip.type === 'video' && track.type === 'video') ||
                    (clip.type === 'audio' && track.type === 'audio') ||
                    (clip.type === 'subtitle' && track.type === 'subtitle') ||
                    (clip.type === 'image' && track.type === 'video')) {
                  targetTrackId = track.id;
                }
                break;
              }
              accumulatedHeight += trackHeight;
            }

            onClipMove(dragClipId, snapping ? Math.round(newStartTime * 10) / 10 : newStartTime, targetTrackId);
          } else {
            onClipMove(dragClipId, snapping ? Math.round(newStartTime * 10) / 10 : newStartTime, clip.trackId);
          }
        }
      } else if ((dragType === 'resize-left' || dragType === 'resize-right') && dragClipId) {
        const clip = sequence?.tracks.flatMap((t) => t.clips).find((c) => c.id === dragClipId);
        if (clip) {
          if (dragType === 'resize-left') {
            const newStartTime = Math.max(0, dragStartTime + deltaTime);
            onClipResize(dragClipId, newStartTime, clip.duration, 'left');
          } else {
            const newDuration = Math.max(0.1, dragStartTime + deltaTime);
            onClipResize(dragClipId, clip.startTime, newDuration, 'right');
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragClipId(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragClipId, dragStartX, dragStartTime, snapping, sequence, onTimeChange, onClipMove, onClipResize]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      onZoomChange(Math.max(0.1, Math.min(10, zoom * zoomFactor)));
    }
  };

  const renderTimeRuler = () => {
    const markers = [];
    const step = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 1 : 0.5;

    for (let time = 0; time <= duration; time += step) {
      const x = timeToPixels(time);
      markers.push(
        <div
          key={time}
          className="absolute top-0 h-full"
          style={{ left: x }}
        >
          <div className="h-2 w-px bg-editor-text-secondary" />
          <span className="absolute top-2 text-xs text-editor-text-secondary transform -translate-x-1/2">
            {formatTime(time)}
          </span>
        </div>
      );

      // Sub-markers
      if (step >= 1) {
        for (let subTime = time + step / 4; subTime < time + step && subTime <= duration; subTime += step / 4) {
          const subX = timeToPixels(subTime);
          markers.push(
            <div
              key={subTime}
              className="absolute top-0 h-1 w-px bg-editor-border"
              style={{ left: subX }}
            />
          );
        }
      }
    }

    return markers;
  };

  // Handle transition drag over clip
  const handleTransitionDragOver = useCallback((e: React.DragEvent, clipId: string, position: 'in' | 'out') => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.types.includes('application/json');
      if (data) {
        setDropTargetClip({ clipId, position });
        e.dataTransfer.dropEffect = 'copy';
      }
    } catch {
      // Ignore errors during drag
    }
  }, []);

  const handleTransitionDragLeave = useCallback(() => {
    setDropTargetClip(null);
  }, []);

  const handleTransitionDrop = useCallback((e: React.DragEvent, clipId: string, position: 'in' | 'out') => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetClip(null);

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.type === 'transition' && onApplyTransition) {
          const transition: Transition = {
            id: uuidv4(),
            type: data.transitionId,
            name: data.transitionName,
            category: data.category,
            duration: data.duration || 1,
            alignment: 'center',
            parameters: [],
          };
          onApplyTransition(clipId, transition, position);
        }
      }
    } catch (err) {
      console.error('Failed to parse transition data:', err);
    }
  }, [onApplyTransition]);

  const renderClip = (clip: Clip, track: Track) => {
    const x = timeToPixels(clip.startTime);
    const width = timeToPixels(clip.duration);
    const isSelected = selectedClips.includes(clip.id);
    const media = mediaItems.find((m) => m.id === clip.mediaId);
    const hasInTransition = clip.transitions?.in;
    const hasOutTransition = clip.transitions?.out;
    const isInDropTarget = dropTargetClip?.clipId === clip.id && dropTargetClip?.position === 'in';
    const isOutDropTarget = dropTargetClip?.clipId === clip.id && dropTargetClip?.position === 'out';

    return (
      <div
        key={clip.id}
        className={`clip absolute top-1 bottom-1 rounded overflow-hidden cursor-pointer ${
          isSelected ? 'selected' : ''
        } ${!clip.enabled ? 'opacity-50' : ''}`}
        style={{
          left: x,
          width: Math.max(width, 20),
          backgroundColor: clip.color || (clip.type === 'video' ? '#4a9eff' : clip.type === 'audio' ? '#4caf50' : '#f59e0b'),
        }}
        onMouseDown={(e) => handleClipMouseDown(e, clip, 'move')}
      >
        {/* Transition drop zones */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 z-20 transition-colors ${
            isInDropTarget ? 'bg-purple-500/50' : 'hover:bg-purple-500/20'
          }`}
          onDragOver={(e) => handleTransitionDragOver(e, clip.id, 'in')}
          onDragLeave={handleTransitionDragLeave}
          onDrop={(e) => handleTransitionDrop(e, clip.id, 'in')}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 z-20 transition-colors ${
            isOutDropTarget ? 'bg-purple-500/50' : 'hover:bg-purple-500/20'
          }`}
          onDragOver={(e) => handleTransitionDragOver(e, clip.id, 'out')}
          onDragLeave={handleTransitionDragLeave}
          onDrop={(e) => handleTransitionDrop(e, clip.id, 'out')}
        />

        {/* In Transition indicator */}
        {hasInTransition && (
          <div
            className="absolute left-0 top-0 bottom-0 flex items-center justify-center z-10"
            style={{
              width: timeToPixels(hasInTransition.duration),
              background: `linear-gradient(to right, ${TRANSITION_COLORS[hasInTransition.category] || '#8b5cf6'}90, transparent)`,
            }}
            title={`${hasInTransition.name} (${hasInTransition.duration}s)`}
          >
            <span className="text-white text-xs font-bold opacity-80">◐</span>
          </div>
        )}

        {/* Out Transition indicator */}
        {hasOutTransition && (
          <div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center z-10"
            style={{
              width: timeToPixels(hasOutTransition.duration),
              background: `linear-gradient(to left, ${TRANSITION_COLORS[hasOutTransition.category] || '#8b5cf6'}90, transparent)`,
            }}
            title={`${hasOutTransition.name} (${hasOutTransition.duration}s)`}
          >
            <span className="text-white text-xs font-bold opacity-80">◑</span>
          </div>
        )}

        {/* Resize handles */}
        <div
          className="resize-handle resize-handle-left"
          onMouseDown={(e) => handleClipMouseDown(e, clip, 'resize-left')}
        />
        <div
          className="resize-handle resize-handle-right"
          onMouseDown={(e) => handleClipMouseDown(e, clip, 'resize-right')}
        />

        {/* Clip content */}
        <div className="relative h-full p-1 overflow-hidden">
          {/* Thumbnail/Waveform */}
          {showThumbnails && clip.type === 'video' && media?.thumbnail && (
            <div className="absolute inset-0 opacity-30">
              <img src={media.thumbnail} alt="" className="h-full object-cover" />
            </div>
          )}

          {showWaveforms && clip.type === 'audio' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                {Array.from({ length: 50 }).map((_, i) => {
                  const height = Math.random() * 30 + 5;
                  return (
                    <rect
                      key={i}
                      x={i * 2}
                      y={(40 - height) / 2}
                      width="1.5"
                      height={height}
                      fill="currentColor"
                    />
                  );
                })}
              </svg>
            </div>
          )}

          {/* Subtitle indicator */}
          {clip.type === 'subtitle' && clip.subtitles && (
            <div className="absolute inset-0 flex items-center px-1 opacity-70 overflow-hidden">
              <span className="text-xs truncate">
                {clip.subtitles.length} subtitle{clip.subtitles.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Clip name */}
          <div className="relative z-10 text-xs text-white truncate font-medium drop-shadow">
            {clip.name}
          </div>

          {/* Duration indicator */}
          {width > 60 && (
            <div className="absolute bottom-0 right-1 text-xs text-white/70">
              {formatTime(clip.duration)}
            </div>
          )}

          {/* Speed indicator */}
          {clip.speed !== 1 && (
            <div className="absolute bottom-0 left-1 text-xs text-yellow-400">
              {clip.speed}x
            </div>
          )}
        </div>

        {/* Effects indicator */}
        {clip.effects.length > 0 && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-bl" />
        )}

        {/* Transitions indicator badge */}
        {(hasInTransition || hasOutTransition) && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-purple-500 rounded-br" />
        )}
      </div>
    );
  };

  const renderTrack = (track: Track, index: number) => {
    return (
      <div
        key={track.id}
        className="flex border-b border-editor-border"
        style={{ height: track.height }}
      >
        {/* Track header */}
        <div
          className="flex-shrink-0 bg-editor-surface border-r border-editor-border p-2 flex flex-col justify-between"
          style={{ width: TRACK_HEADER_WIDTH }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium truncate">{track.name}</span>
            <div className="flex items-center gap-1">
              <button
                className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
                  track.muted ? 'bg-red-500' : 'hover:bg-editor-border'
                }`}
                title="Mute"
              >
                M
              </button>
              <button
                className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
                  track.solo ? 'bg-yellow-500' : 'hover:bg-editor-border'
                }`}
                title="Solo"
              >
                S
              </button>
              <button
                className={`w-5 h-5 flex items-center justify-center rounded text-xs ${
                  track.locked ? 'bg-editor-accent' : 'hover:bg-editor-border'
                }`}
                title="Lock"
              >
                🔒
              </button>
            </div>
          </div>

          {track.type === 'audio' && (
            <div className="flex items-center gap-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={track.volume}
                className="flex-1 h-1"
                title={`Volume: ${Math.round(track.volume * 100)}%`}
              />
            </div>
          )}

          {track.type === 'subtitle' && (
            <div className="text-xs text-amber-500">CC</div>
          )}
        </div>

        {/* Track content */}
        <div
          className="relative flex-1 bg-editor-timeline"
          style={{ width: timelineWidth }}
        >
          {track.clips.map((clip) => renderClip(clip, track))}
        </div>
      </div>
    );
  };

  if (!sequence) {
    return (
      <div className="h-full flex items-center justify-center bg-editor-timeline text-editor-text-secondary">
        <div className="text-center">
          <p className="text-lg mb-2">No sequence selected</p>
          <p className="text-sm">Create or select a sequence to start editing</p>
        </div>
      </div>
    );
  }

  const videoTracks = sequence.tracks.filter((t) => t.type === 'video');
  const audioTracks = sequence.tracks.filter((t) => t.type === 'audio');
  const subtitleTracks = sequence.tracks.filter((t) => t.type === 'subtitle');

  return (
    <div className="flex flex-col h-full bg-editor-timeline relative overflow-hidden" onWheel={handleWheel}>
      {/* Timeline header with time ruler */}
      <div className="flex border-b border-editor-border h-6">
        <div
          className="flex-shrink-0 bg-editor-surface border-r border-editor-border flex items-center justify-between px-2"
          style={{ width: TRACK_HEADER_WIDTH }}
        >
          <span className="text-xs text-editor-text-secondary">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <button
              className="w-4 h-4 flex items-center justify-center text-xs hover:bg-editor-border rounded"
              onClick={() => onZoomChange(zoom * 1.2)}
            >
              +
            </button>
            <button
              className="w-4 h-4 flex items-center justify-center text-xs hover:bg-editor-border rounded"
              onClick={() => onZoomChange(zoom / 1.2)}
            >
              −
            </button>
          </div>
        </div>
        <div
          className="relative flex-1 overflow-hidden cursor-pointer"
          onClick={handleTimelineClick}
          ref={timelineRef}
        >
          <div className="relative h-full" style={{ width: timelineWidth }}>
            {renderTimeRuler()}
          </div>
        </div>
      </div>

      {/* Tracks container */}
      <div
        ref={tracksContainerRef}
        className="flex-1 overflow-auto"
        onScroll={(e) => setScrollLeft((e.target as HTMLElement).scrollLeft)}
      >
        <div style={{ width: timelineWidth + TRACK_HEADER_WIDTH, position: 'relative' }}>
          {/* Video tracks */}
          {videoTracks.map((track, index) => renderTrack(track, index))}

          {/* Add video track button */}
          <div className="flex border-b border-editor-border h-8">
            <div
              className="flex-shrink-0 bg-editor-surface border-r border-editor-border flex items-center justify-center"
              style={{ width: TRACK_HEADER_WIDTH }}
            >
              <button
                className="text-xs text-editor-text-secondary hover:text-editor-text flex items-center gap-1"
                onClick={() => onAddTrack('video')}
              >
                + Add Video Track
              </button>
            </div>
            <div className="flex-1 bg-editor-timeline/50" />
          </div>

          {/* Audio tracks */}
          {audioTracks.map((track, index) => renderTrack(track, index))}

          {/* Add audio track button */}
          <div className="flex border-b border-editor-border h-8">
            <div
              className="flex-shrink-0 bg-editor-surface border-r border-editor-border flex items-center justify-center"
              style={{ width: TRACK_HEADER_WIDTH }}
            >
              <button
                className="text-xs text-editor-text-secondary hover:text-editor-text flex items-center gap-1"
                onClick={() => onAddTrack('audio')}
              >
                + Add Audio Track
              </button>
            </div>
            <div className="flex-1 bg-editor-timeline/50" />
          </div>

          {/* Subtitle tracks */}
          {subtitleTracks.map((track, index) => renderTrack(track, index))}

          {/* Add subtitle track button */}
          <div className="flex border-b border-editor-border h-8">
            <div
              className="flex-shrink-0 bg-editor-surface border-r border-editor-border flex items-center justify-center"
              style={{ width: TRACK_HEADER_WIDTH }}
            >
              <button
                className="text-xs text-editor-text-secondary hover:text-editor-text flex items-center gap-1"
                onClick={() => onAddTrack('subtitle')}
              >
                + Add Subtitle Track
              </button>
            </div>
            <div className="flex-1 bg-editor-timeline/50" />
          </div>

          {/* Playhead - inside the scrollable content */}
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              left: TRACK_HEADER_WIDTH + timeToPixels(currentTime),
              top: 0,
              bottom: 0,
              width: '2px',
              background: '#ff4444',
              zIndex: 50,
            }}
          >
            <div
              className="cursor-pointer pointer-events-auto"
              style={{
                position: 'absolute',
                top: 0,
                left: '-6px',
                width: '14px',
                height: '14px',
                background: '#ff4444',
                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
              }}
              onMouseDown={handlePlayheadMouseDown}
            />
          </div>

          {/* In/Out points */}
          {sequence.inPoint !== null && (
            <div
              className="pointer-events-none"
              style={{
                position: 'absolute',
                left: TRACK_HEADER_WIDTH + timeToPixels(sequence.inPoint),
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#eab308',
              }}
            />
          )}
          {sequence.outPoint !== null && (
            <div
              className="pointer-events-none"
              style={{
                position: 'absolute',
                left: TRACK_HEADER_WIDTH + timeToPixels(sequence.outPoint),
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#eab308',
              }}
            />
          )}
        </div>
      </div>

      {/* Timeline footer with zoom slider */}
      <div className="flex items-center justify-between px-2 py-1 bg-editor-surface border-t border-editor-border">
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-editor-text-secondary hover:text-editor-text"
            onClick={() => onZoomChange(1)}
          >
            Fit
          </button>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-editor-text-secondary">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="text-xs text-editor-text-secondary">
          Duration: {formatTime(duration)} | {sequence.frameRate}fps
        </div>
      </div>
    </div>
  );
};

export default Timeline;
