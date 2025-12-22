import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import MediaBrowser from './components/MediaBrowser';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import EffectsPanel from './components/EffectsPanel';
import PropertiesPanel from './components/PropertiesPanel';
import SubtitlePanel from './components/SubtitlePanel';
import ExportDialog from './components/ExportDialog';
import KeyboardShortcutsDialog from './components/KeyboardShortcutsDialog';
import { Project, Sequence, MediaItem, Track, Clip, PlaybackState, EditorState, SubtitleEntry, Transition } from '../types';

const { ipcRenderer } = window.require('electron');

const createDefaultProject = (): Project => ({
  id: uuidv4(),
  name: 'Untitled Project',
  path: null,
  created: new Date(),
  modified: new Date(),
  sequences: [],
  activeSequenceId: null,
  mediaItems: [],
  bins: [{ id: 'root', name: 'Project', parentId: null, mediaIds: [], expanded: true }],
  settings: {
    defaultSequenceSettings: {
      width: 1920,
      height: 1080,
      frameRate: 30,
      sampleRate: 48000,
    },
    scratchDisk: '',
    autoSaveInterval: 5,
    autoSaveEnabled: true,
  },
});

const createDefaultSequence = (name: string, settings: Project['settings']['defaultSequenceSettings']): Sequence => ({
  id: uuidv4(),
  name,
  width: settings.width,
  height: settings.height,
  frameRate: settings.frameRate,
  sampleRate: settings.sampleRate,
  duration: 0,
  tracks: [
    {
      id: uuidv4(),
      name: 'Video 1',
      type: 'video',
      height: 80,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1,
      pan: 0,
      clips: [],
    },
    {
      id: uuidv4(),
      name: 'Audio 1',
      type: 'audio',
      height: 60,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1,
      pan: 0,
      clips: [],
    },
  ],
  markers: [],
  inPoint: null,
  outPoint: null,
});

const App: React.FC = () => {
  const [project, setProject] = useState<Project>(createDefaultProject());
  const [activeSequence, setActiveSequence] = useState<Sequence | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    loop: false,
    loopIn: null,
    loopOut: null,
  });
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<EditorState['tool']>('select');
  const [snapping, setSnapping] = useState(true);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [timelineHeight, setTimelineHeight] = useState(300);
  const [leftPanelTab, setLeftPanelTab] = useState<'media' | 'subtitles'>('media');

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with a default sequence
  useEffect(() => {
    if (project.sequences.length === 0) {
      const sequence = createDefaultSequence('Sequence 1', project.settings.defaultSequenceSettings);
      setProject((prev) => ({
        ...prev,
        sequences: [sequence],
        activeSequenceId: sequence.id,
      }));
      setActiveSequence(sequence);
    }
  }, []);

  // Playback logic
  useEffect(() => {
    if (playback.isPlaying && activeSequence) {
      playbackIntervalRef.current = setInterval(() => {
        setPlayback((prev) => {
          const newTime = prev.currentTime + (1 / activeSequence.frameRate) * prev.playbackRate;
          const maxTime = activeSequence.duration || 300;

          if (prev.loop && prev.loopOut !== null && newTime >= prev.loopOut) {
            return { ...prev, currentTime: prev.loopIn || 0 };
          }

          if (newTime >= maxTime) {
            return { ...prev, isPlaying: false, currentTime: maxTime };
          }

          return { ...prev, currentTime: newTime };
        });
      }, 1000 / activeSequence.frameRate);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [playback.isPlaying, activeSequence]);

  // IPC event handlers
  useEffect(() => {
    const handlers: { [key: string]: (...args: unknown[]) => void } = {
      'menu-new-project': () => {
        setProject(createDefaultProject());
        setActiveSequence(null);
        setSelectedClips([]);
        setSelectedMedia([]);
      },
      'menu-save-project': () => handleSaveProject(),
      'save-project-as': (_: unknown, path: string) => handleSaveProjectAs(path),
      'project-opened': (_: unknown, { path, data }: { path: string; data: Project }) => {
        setProject({ ...data, path });
        if (data.activeSequenceId) {
          const seq = data.sequences.find((s) => s.id === data.activeSequenceId);
          setActiveSequence(seq || null);
        }
      },
      'media-imported': (_: unknown, paths: string[]) => handleImportMedia(paths),
      'menu-export': () => setShowExportDialog(true),
      'menu-play-pause': () => togglePlayback(),
      'menu-stop': () => stopPlayback(),
      'menu-go-start': () => goToStart(),
      'menu-go-end': () => goToEnd(),
      'menu-prev-frame': () => prevFrame(),
      'menu-next-frame': () => nextFrame(),
      'menu-set-in': () => setInPoint(),
      'menu-set-out': () => setOutPoint(),
      'menu-split-clip': () => splitClip(),
      'menu-delete': () => deleteSelectedClips(),
      'menu-deselect-all': () => setSelectedClips([]),
      'menu-zoom-in': () => setZoom((z) => Math.min(z * 1.5, 10)),
      'menu-zoom-out': () => setZoom((z) => Math.max(z / 1.5, 0.1)),
      'menu-zoom-fit': () => setZoom(1),
      'menu-add-video-track': () => addTrack('video'),
      'menu-add-audio-track': () => addTrack('audio'),
      'menu-show-shortcuts': () => setShowShortcutsDialog(true),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      ipcRenderer.on(event, handler);
    });

    return () => {
      Object.keys(handlers).forEach((event) => {
        ipcRenderer.removeAllListeners(event);
      });
    };
  }, [project, activeSequence, selectedClips]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'Delete':
        case 'Backspace':
          if (!e.metaKey && !e.ctrlKey) deleteSelectedClips();
          break;
        case 'v':
        case 'V':
          if (!e.metaKey && !e.ctrlKey) setTool('select');
          break;
        case 'c':
        case 'C':
          if (!e.metaKey && !e.ctrlKey) setTool('razor');
          break;
        case 'y':
        case 'Y':
          setTool('slip');
          break;
        case 'u':
        case 'U':
          setTool('slide');
          break;
        case 'b':
        case 'B':
          setTool('ripple');
          break;
        case 'n':
        case 'N':
          setTool('roll');
          break;
        case 'h':
        case 'H':
          setTool('hand');
          break;
        case 'z':
        case 'Z':
          if (!e.metaKey && !e.ctrlKey) setTool('zoom');
          break;
        case 's':
        case 'S':
          setSnapping((s) => !s);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveProject = async () => {
    if (project.path) {
      await ipcRenderer.invoke('save-project', { filePath: project.path, data: project });
    } else {
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Save Project',
        filters: [{ name: 'Pro Video Editor Project', extensions: ['pvep'] }],
        defaultPath: `${project.name}.pvep`,
      });
      if (!result.canceled && result.filePath) {
        await handleSaveProjectAs(result.filePath);
      }
    }
  };

  const handleSaveProjectAs = async (path: string) => {
    const updatedProject = { ...project, path, modified: new Date() };
    await ipcRenderer.invoke('save-project', { filePath: path, data: updatedProject });
    setProject(updatedProject);
  };

  const handleImportMedia = useCallback(async (paths: string[]) => {
    const newMedia: MediaItem[] = [];

    for (const filePath of paths) {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      let type: MediaItem['type'] = 'video';

      if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext)) {
        type = 'audio';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(ext)) {
        type = 'image';
      }

      const fileInfo = await ipcRenderer.invoke('get-file-info', filePath);

      const media: MediaItem = {
        id: uuidv4(),
        name: filePath.split('/').pop() || filePath.split('\\').pop() || 'Untitled',
        type,
        path: filePath,
        duration: type === 'image' ? 5 : 10, // Default duration, would be read from file
        width: 1920,
        height: 1080,
        frameRate: 30,
        size: fileInfo.success ? fileInfo.info.size : 0,
        dateAdded: new Date(),
      };

      newMedia.push(media);
    }

    setProject((prev) => ({
      ...prev,
      mediaItems: [...prev.mediaItems, ...newMedia],
      bins: prev.bins.map((bin) =>
        bin.id === 'root'
          ? { ...bin, mediaIds: [...bin.mediaIds, ...newMedia.map((m) => m.id)] }
          : bin
      ),
    }));
  }, []);

  const togglePlayback = useCallback(() => {
    setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const stopPlayback = useCallback(() => {
    setPlayback((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  const goToStart = useCallback(() => {
    setPlayback((prev) => ({ ...prev, currentTime: 0, isPlaying: false }));
  }, []);

  const goToEnd = useCallback(() => {
    if (activeSequence) {
      setPlayback((prev) => ({
        ...prev,
        currentTime: activeSequence.duration || 0,
        isPlaying: false,
      }));
    }
  }, [activeSequence]);

  const prevFrame = useCallback(() => {
    if (activeSequence) {
      setPlayback((prev) => ({
        ...prev,
        currentTime: Math.max(0, prev.currentTime - 1 / activeSequence.frameRate),
        isPlaying: false,
      }));
    }
  }, [activeSequence]);

  const nextFrame = useCallback(() => {
    if (activeSequence) {
      setPlayback((prev) => ({
        ...prev,
        currentTime: prev.currentTime + 1 / activeSequence.frameRate,
        isPlaying: false,
      }));
    }
  }, [activeSequence]);

  const setInPoint = useCallback(() => {
    if (activeSequence) {
      setActiveSequence({ ...activeSequence, inPoint: playback.currentTime });
    }
  }, [activeSequence, playback.currentTime]);

  const setOutPoint = useCallback(() => {
    if (activeSequence) {
      setActiveSequence({ ...activeSequence, outPoint: playback.currentTime });
    }
  }, [activeSequence, playback.currentTime]);

  const splitClip = useCallback(() => {
    if (!activeSequence || selectedClips.length === 0) return;

    const updatedTracks = activeSequence.tracks.map((track) => {
      const newClips: Clip[] = [];

      track.clips.forEach((clip) => {
        if (selectedClips.includes(clip.id)) {
          const splitPoint = playback.currentTime;
          if (splitPoint > clip.startTime && splitPoint < clip.startTime + clip.duration) {
            const firstHalfDuration = splitPoint - clip.startTime;
            const secondHalfDuration = clip.duration - firstHalfDuration;

            newClips.push({
              ...clip,
              duration: firstHalfDuration,
              outPoint: clip.inPoint + firstHalfDuration * clip.speed,
              gain: clip.gain ?? 0,
            });

            newClips.push({
              ...clip,
              id: uuidv4(),
              startTime: splitPoint,
              duration: secondHalfDuration,
              inPoint: clip.inPoint + firstHalfDuration * clip.speed,
              gain: clip.gain ?? 0,
              linkedClipId: undefined, // Break link on split
            });
          } else {
            newClips.push(clip);
          }
        } else {
          newClips.push(clip);
        }
      });

      return { ...track, clips: newClips };
    });

    setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    setSelectedClips([]);
  }, [activeSequence, selectedClips, playback.currentTime]);

  const deleteSelectedClips = useCallback(() => {
    if (!activeSequence || selectedClips.length === 0) return;

    const updatedTracks = activeSequence.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => !selectedClips.includes(clip.id)),
    }));

    setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    setSelectedClips([]);
  }, [activeSequence, selectedClips]);

  const addTrack = useCallback(
    (type: 'video' | 'audio' | 'subtitle') => {
      if (!activeSequence) return;

      const trackCount = activeSequence.tracks.filter((t) => t.type === type).length + 1;
      const trackName = type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Subtitle';
      const newTrack: Track = {
        id: uuidv4(),
        name: `${trackName} ${trackCount}`,
        type,
        height: type === 'video' ? 80 : type === 'audio' ? 60 : 40,
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 1,
        pan: 0,
        clips: [],
      };

      let insertIndex: number;
      if (type === 'video') {
        insertIndex = 0;
      } else if (type === 'audio') {
        insertIndex = activeSequence.tracks.findIndex((t) => t.type === 'audio');
        if (insertIndex === -1) {
          insertIndex = activeSequence.tracks.filter((t) => t.type === 'video').length;
        }
      } else {
        // Subtitle tracks go at the end
        insertIndex = activeSequence.tracks.length;
      }

      const updatedTracks = [...activeSequence.tracks];
      updatedTracks.splice(insertIndex, 0, newTrack);

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const handleAddClipToTimeline = useCallback(
    (mediaItem: MediaItem, trackId?: string) => {
      if (!activeSequence) return;

      // For video files, we split into separate video and audio clips
      if (mediaItem.type === 'video') {
        const videoTrack = activeSequence.tracks.find((t) => t.type === 'video');
        const audioTrack = activeSequence.tracks.find((t) => t.type === 'audio');

        if (!videoTrack || !audioTrack) {
          addTrack(!videoTrack ? 'video' : 'audio');
          return;
        }

        // Calculate start time based on latest clip end in video track
        const lastVideoClipEnd = videoTrack.clips.reduce(
          (max, clip) => Math.max(max, clip.startTime + clip.duration),
          0
        );

        const videoClipId = uuidv4();
        const audioClipId = uuidv4();

        // Create video clip
        const videoClip: Clip = {
          id: videoClipId,
          mediaId: mediaItem.id,
          trackId: videoTrack.id,
          name: mediaItem.name,
          type: 'video',
          startTime: lastVideoClipEnd,
          duration: mediaItem.duration,
          inPoint: 0,
          outPoint: mediaItem.duration,
          speed: 1,
          volume: 1,
          gain: 0,
          opacity: 1,
          effects: [],
          transitions: {},
          locked: false,
          enabled: true,
          color: '#4a9eff',
          linkedClipId: audioClipId, // Link to audio clip
        };

        // Create linked audio clip
        const audioClip: Clip = {
          id: audioClipId,
          mediaId: mediaItem.id,
          trackId: audioTrack.id,
          name: `${mediaItem.name} (Audio)`,
          type: 'audio',
          startTime: lastVideoClipEnd, // Same start time as video
          duration: mediaItem.duration,
          inPoint: 0,
          outPoint: mediaItem.duration,
          speed: 1,
          volume: 1,
          gain: 0,
          opacity: 1,
          effects: [],
          transitions: {},
          locked: false,
          enabled: true,
          color: '#4caf50',
          linkedClipId: videoClipId, // Link to video clip
        };

        const updatedTracks = activeSequence.tracks.map((track) => {
          if (track.id === videoTrack.id) {
            return { ...track, clips: [...track.clips, videoClip] };
          }
          if (track.id === audioTrack.id) {
            return { ...track, clips: [...track.clips, audioClip] };
          }
          return track;
        });

        const newDuration = Math.max(
          activeSequence.duration,
          lastVideoClipEnd + mediaItem.duration
        );

        setActiveSequence({
          ...activeSequence,
          tracks: updatedTracks,
          duration: newDuration,
        });
        return;
      }

      // For audio and image files, add to appropriate track
      let targetTrack = trackId
        ? activeSequence.tracks.find((t) => t.id === trackId)
        : activeSequence.tracks.find(
            (t) => t.type === (mediaItem.type === 'audio' ? 'audio' : 'video')
          );

      if (!targetTrack) {
        addTrack(mediaItem.type === 'audio' ? 'audio' : 'video');
        return;
      }

      const lastClipEnd = targetTrack.clips.reduce(
        (max, clip) => Math.max(max, clip.startTime + clip.duration),
        0
      );

      const newClip: Clip = {
        id: uuidv4(),
        mediaId: mediaItem.id,
        trackId: targetTrack.id,
        name: mediaItem.name,
        type: mediaItem.type,
        startTime: lastClipEnd,
        duration: mediaItem.duration,
        inPoint: 0,
        outPoint: mediaItem.duration,
        speed: 1,
        volume: 1,
        gain: 0,
        opacity: 1,
        effects: [],
        transitions: {},
        locked: false,
        enabled: true,
        color: mediaItem.type === 'audio' ? '#4caf50' : '#ff9800',
      };

      const updatedTracks = activeSequence.tracks.map((track) =>
        track.id === targetTrack!.id
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      );

      const newDuration = Math.max(
        activeSequence.duration,
        newClip.startTime + newClip.duration
      );

      setActiveSequence({
        ...activeSequence,
        tracks: updatedTracks,
        duration: newDuration,
      });
    },
    [activeSequence, addTrack]
  );

  const handleTimeChange = useCallback((time: number) => {
    setPlayback((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const handleCreateSubtitleClip = useCallback(
    (subtitles: SubtitleEntry[], duration: number) => {
      if (!activeSequence) return;

      // Find or create subtitle track
      let subtitleTrack = activeSequence.tracks.find((t) => t.type === 'subtitle');
      if (!subtitleTrack) {
        addTrack('subtitle');
        return; // Track will be created, user can try again
      }

      const lastClipEnd = subtitleTrack.clips.reduce(
        (max, clip) => Math.max(max, clip.startTime + clip.duration),
        0
      );

      const subtitleClip: Clip = {
        id: uuidv4(),
        mediaId: '', // No associated media
        trackId: subtitleTrack.id,
        name: 'Subtitles',
        type: 'subtitle',
        startTime: lastClipEnd,
        duration: duration,
        inPoint: 0,
        outPoint: duration,
        speed: 1,
        volume: 1,
        gain: 0,
        opacity: 1,
        effects: [],
        transitions: {},
        locked: false,
        enabled: true,
        color: '#f59e0b',
        subtitles: subtitles,
      };

      const updatedTracks = activeSequence.tracks.map((track) =>
        track.id === subtitleTrack!.id
          ? { ...track, clips: [...track.clips, subtitleClip] }
          : track
      );

      const newDuration = Math.max(
        activeSequence.duration,
        subtitleClip.startTime + subtitleClip.duration
      );

      setActiveSequence({
        ...activeSequence,
        tracks: updatedTracks,
        duration: newDuration,
      });
    },
    [activeSequence, addTrack]
  );

  const handleApplyTransition = useCallback(
    (clipId: string, transition: Transition, position: 'in' | 'out') => {
      if (!activeSequence) return;

      const updatedTracks = activeSequence.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          return {
            ...clip,
            transitions: {
              ...clip.transitions,
              [position]: transition,
            },
          };
        }),
      }));

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const handleRemoveTransition = useCallback(
    (clipId: string, position: 'in' | 'out') => {
      if (!activeSequence) return;

      const updatedTracks = activeSequence.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const newTransitions = { ...clip.transitions };
          delete newTransitions[position];
          return {
            ...clip,
            transitions: newTransitions,
          };
        }),
      }));

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const handleUpdateTransitionDuration = useCallback(
    (clipId: string, position: 'in' | 'out', duration: number) => {
      if (!activeSequence) return;

      const updatedTracks = activeSequence.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const transition = clip.transitions[position];
          if (!transition) return clip;
          return {
            ...clip,
            transitions: {
              ...clip.transitions,
              [position]: { ...transition, duration },
            },
          };
        }),
      }));

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const handleImportMediaClick = useCallback(async () => {
    const result = await ipcRenderer.invoke('show-open-dialog', {
      title: 'Import Media',
      filters: [
        { name: 'All Media', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'] },
        { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'] },
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'] },
        { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });
    if (!result.canceled && result.filePaths?.length > 0) {
      handleImportMedia(result.filePaths);
    }
  }, [handleImportMedia]);

  const handleClipMove = useCallback(
    (clipId: string, newStartTime: number, newTrackId: string) => {
      if (!activeSequence) return;

      let movingClip: Clip | null = null;
      let sourceTrackId: string | null = null;

      for (const track of activeSequence.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          movingClip = clip;
          sourceTrackId = track.id;
          break;
        }
      }

      if (!movingClip || !sourceTrackId) return;

      const updatedTracks = activeSequence.tracks.map((track) => {
        if (track.id === sourceTrackId) {
          return {
            ...track,
            clips: track.clips.filter((c) => c.id !== clipId),
          };
        }
        if (track.id === newTrackId) {
          return {
            ...track,
            clips: [
              ...track.clips,
              { ...movingClip!, startTime: Math.max(0, newStartTime), trackId: newTrackId },
            ],
          };
        }
        return track;
      });

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const handleClipResize = useCallback(
    (clipId: string, newStartTime: number, newDuration: number, edge: 'left' | 'right') => {
      if (!activeSequence) return;

      const updatedTracks = activeSequence.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;

          if (edge === 'left') {
            const delta = clip.startTime - newStartTime;
            return {
              ...clip,
              startTime: newStartTime,
              duration: clip.duration + delta,
              inPoint: Math.max(0, clip.inPoint - delta * clip.speed),
            };
          } else {
            return {
              ...clip,
              duration: newDuration,
              outPoint: clip.inPoint + newDuration * clip.speed,
            };
          }
        }),
      }));

      setActiveSequence({ ...activeSequence, tracks: updatedTracks });
    },
    [activeSequence]
  );

  const getSelectedClip = (): Clip | null => {
    if (!activeSequence || selectedClips.length !== 1) return null;
    for (const track of activeSequence.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClips[0]);
      if (clip) return clip;
    }
    return null;
  };

  const getSelectedMediaItem = (): MediaItem | null => {
    if (selectedMedia.length !== 1) return null;
    return project.mediaItems.find((m) => m.id === selectedMedia[0]) || null;
  };

  return (
    <div className="flex flex-col h-screen bg-editor-bg text-editor-text font-editor select-none">
      <Header project={project} />

      <Toolbar
        tool={tool}
        onToolChange={setTool}
        snapping={snapping}
        onSnappingChange={setSnapping}
        showWaveforms={showWaveforms}
        onShowWaveformsChange={setShowWaveforms}
        showThumbnails={showThumbnails}
        onShowThumbnailsChange={setShowThumbnails}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Media Browser / Subtitles & Effects */}
        <div
          className="flex flex-col bg-editor-surface border-r border-editor-border"
          style={{ width: leftPanelWidth }}
        >
          {/* Tab selector */}
          <div className="flex border-b border-editor-border">
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                leftPanelTab === 'media'
                  ? 'text-editor-accent border-b-2 border-editor-accent bg-editor-bg'
                  : 'text-editor-text-secondary hover:text-editor-text'
              }`}
              onClick={() => setLeftPanelTab('media')}
            >
              Media
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                leftPanelTab === 'subtitles'
                  ? 'text-editor-accent border-b-2 border-editor-accent bg-editor-bg'
                  : 'text-editor-text-secondary hover:text-editor-text'
              }`}
              onClick={() => setLeftPanelTab('subtitles')}
            >
              Subtitles
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftPanelTab === 'media' ? (
              <MediaBrowser
                mediaItems={project.mediaItems}
                bins={project.bins}
                selectedMedia={selectedMedia}
                onSelectMedia={setSelectedMedia}
                onAddToTimeline={handleAddClipToTimeline}
                onImportMedia={handleImportMediaClick}
              />
            ) : (
              <SubtitlePanel
                sequence={activeSequence}
                onAddSubtitleTrack={() => addTrack('subtitle')}
                onCreateSubtitleClip={handleCreateSubtitleClip}
              />
            )}
          </div>
          <div
            className="h-1 cursor-row-resize panel-resize-handle"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = 300;
              const onMouseMove = (e: MouseEvent) => {
                const delta = e.clientY - startY;
                // Handle panel resize
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />
          <div className="h-64 overflow-hidden">
            <EffectsPanel
              selectedClip={getSelectedClip()}
              onApplyEffect={(effect) => {
                // Apply effect to selected clip
              }}
            />
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="w-1 cursor-col-resize panel-resize-handle"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = leftPanelWidth;
            const onMouseMove = (e: MouseEvent) => {
              const delta = e.clientX - startX;
              setLeftPanelWidth(Math.max(200, Math.min(500, startWidth + delta)));
            };
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        {/* Center - Preview and Timeline */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 min-h-0">
            <Preview
              sequence={activeSequence}
              currentTime={playback.currentTime}
              isPlaying={playback.isPlaying}
              onPlayPause={togglePlayback}
              onStop={stopPlayback}
              onTimeChange={handleTimeChange}
              onPrevFrame={prevFrame}
              onNextFrame={nextFrame}
              onGoToStart={goToStart}
              onGoToEnd={goToEnd}
              mediaItems={project.mediaItems}
            />
          </div>

          {/* Resize handle */}
          <div
            className="h-1 cursor-row-resize panel-resize-handle"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = timelineHeight;
              const onMouseMove = (e: MouseEvent) => {
                const delta = startY - e.clientY;
                setTimelineHeight(Math.max(150, Math.min(600, startHeight + delta)));
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />

          {/* Timeline */}
          <div style={{ height: timelineHeight }} className="bg-editor-timeline">
            <Timeline
              sequence={activeSequence}
              currentTime={playback.currentTime}
              zoom={zoom}
              tool={tool}
              snapping={snapping}
              showWaveforms={showWaveforms}
              showThumbnails={showThumbnails}
              selectedClips={selectedClips}
              onTimeChange={handleTimeChange}
              onSelectClips={setSelectedClips}
              onClipMove={handleClipMove}
              onClipResize={handleClipResize}
              onZoomChange={setZoom}
              onAddTrack={addTrack}
              onSplitClip={splitClip}
              onApplyTransition={handleApplyTransition}
              mediaItems={project.mediaItems}
            />
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="w-1 cursor-col-resize panel-resize-handle"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = rightPanelWidth;
            const onMouseMove = (e: MouseEvent) => {
              const delta = startX - e.clientX;
              setRightPanelWidth(Math.max(200, Math.min(500, startWidth + delta)));
            };
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        {/* Right Panel - Properties */}
        <div
          className="bg-editor-surface border-l border-editor-border overflow-hidden"
          style={{ width: rightPanelWidth }}
        >
          <PropertiesPanel
            selectedClip={getSelectedClip()}
            selectedMedia={getSelectedMediaItem()}
            sequence={activeSequence}
            onClipUpdate={(clipId, updates) => {
              if (!activeSequence) return;
              const updatedTracks = activeSequence.tracks.map((track) => ({
                ...track,
                clips: track.clips.map((clip) =>
                  clip.id === clipId ? { ...clip, ...updates } : clip
                ),
              }));
              setActiveSequence({ ...activeSequence, tracks: updatedTracks });
            }}
            onUpdateTransitionDuration={handleUpdateTransitionDuration}
            onRemoveTransition={handleRemoveTransition}
          />
        </div>
      </div>

      {/* Dialogs */}
      {showExportDialog && (
        <ExportDialog
          sequence={activeSequence}
          onClose={() => setShowExportDialog(false)}
          onExport={(settings) => {
            console.log('Export with settings:', settings);
            setShowExportDialog(false);
          }}
        />
      )}

      {showShortcutsDialog && (
        <KeyboardShortcutsDialog onClose={() => setShowShortcutsDialog(false)} />
      )}
    </div>
  );
};

export default App;
