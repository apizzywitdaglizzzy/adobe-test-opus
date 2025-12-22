export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  path: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  frameRate?: number;
  audioChannels?: number;
  sampleRate?: number;
  thumbnail?: string;
  waveform?: number[];
  size: number;
  dateAdded: Date;
}

export interface Clip {
  id: string;
  mediaId: string;
  trackId: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'subtitle';
  startTime: number; // position on timeline in seconds
  duration: number; // clip duration in seconds
  inPoint: number; // source in point
  outPoint: number; // source out point
  speed: number;
  volume: number; // linear volume (0-2, where 1 = 0dB)
  gain: number; // gain in decibels (-infinity to +12dB)
  opacity: number;
  effects: Effect[];
  transitions: { in?: Transition; out?: Transition };
  locked: boolean;
  enabled: boolean;
  color: string;
  linkedClipId?: string; // ID of linked clip (e.g., audio linked to video)
  subtitles?: SubtitleEntry[]; // For subtitle clips
}

export interface SubtitleEntry {
  id: string;
  startTime: number; // relative to clip start
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'subtitle';
  height: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  visible: boolean;
  volume: number;
  pan: number;
  clips: Clip[];
}

export interface Effect {
  id: string;
  name: string;
  type: string;
  category: 'video' | 'audio' | 'color' | 'transform';
  enabled: boolean;
  parameters: EffectParameter[];
  keyframes: Keyframe[];
}

export interface EffectParameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'color' | 'select' | 'range';
  value: number | boolean | string;
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
}

export interface Keyframe {
  id: string;
  parameterId: string;
  time: number;
  value: number | boolean | string;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  bezierHandles?: { x1: number; y1: number; x2: number; y2: number };
}

export interface Transition {
  id: string;
  type: string;
  name: string;
  duration: number;
  parameters: EffectParameter[];
}

export interface Sequence {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: number;
  sampleRate: number;
  duration: number;
  tracks: Track[];
  markers: Marker[];
  inPoint: number | null;
  outPoint: number | null;
}

export interface Marker {
  id: string;
  time: number;
  name: string;
  color: string;
  comment: string;
}

export interface Project {
  id: string;
  name: string;
  path: string | null;
  created: Date;
  modified: Date;
  sequences: Sequence[];
  activeSequenceId: string | null;
  mediaItems: MediaItem[];
  bins: Bin[];
  settings: ProjectSettings;
}

export interface Bin {
  id: string;
  name: string;
  parentId: string | null;
  mediaIds: string[];
  expanded: boolean;
}

export interface ProjectSettings {
  defaultSequenceSettings: {
    width: number;
    height: number;
    frameRate: number;
    sampleRate: number;
  };
  scratchDisk: string;
  autoSaveInterval: number;
  autoSaveEnabled: boolean;
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'avi' | 'gif';
  codec: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  audioCodec: string;
  audioBitrate: number;
  outputPath: string;
  range: 'full' | 'inout' | 'custom';
  customStart?: number;
  customEnd?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  loop: boolean;
  loopIn: number | null;
  loopOut: number | null;
}

export interface SelectionState {
  clips: string[];
  tracks: string[];
  mediaItems: string[];
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  state: unknown;
}

export interface EditorState {
  project: Project | null;
  activeSequence: Sequence | null;
  playback: PlaybackState;
  selection: SelectionState;
  zoom: number;
  scrollPosition: { x: number; y: number };
  tool: 'select' | 'razor' | 'slip' | 'slide' | 'ripple' | 'roll' | 'hand' | 'zoom';
  snapping: boolean;
  showWaveforms: boolean;
  showThumbnails: boolean;
  history: HistoryEntry[];
  historyIndex: number;
}

export type EffectPreset = {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultParams: EffectParameter[];
};

export type TransitionPreset = {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultDuration: number;
  defaultParams: EffectParameter[];
};
