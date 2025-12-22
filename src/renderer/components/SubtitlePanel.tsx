import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SubtitleEntry, Sequence } from '../../types';

interface SubtitlePanelProps {
  sequence: Sequence | null;
  onAddSubtitleTrack: () => void;
  onCreateSubtitleClip: (subtitles: SubtitleEntry[], duration: number) => void;
}

// Declare Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  sequence,
  onAddSubtitleTrack,
  onCreateSubtitleClip,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-US');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastResultTimeRef = useRef<number>(0);

  // Check if Web Speech API is available
  const speechRecognitionAvailable = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Note: sequence prop is available but currently not used directly
  void sequence; // Prevent unused variable warning

  const handleStartRecording = useCallback(() => {
    if (!speechRecognitionAvailable) {
      setError('Speech recognition is not available in this browser');
      return;
    }

    setError(null);
    setIsRecording(true);
    setTranscriptText('');
    setSubtitleEntries([]);
    startTimeRef.current = Date.now();
    lastResultTimeRef.current = 0;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;

          // Create a subtitle entry for the final result
          const entry: SubtitleEntry = {
            id: uuidv4(),
            startTime: lastResultTimeRef.current,
            endTime: currentTime,
            text: result[0].transcript.trim(),
          };

          if (entry.text) {
            setSubtitleEntries((prev) => [...prev, entry]);
          }
          lastResultTimeRef.current = currentTime;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscriptText((prev) => prev + finalTranscript);
    };

    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error:', event);
      setError('Speech recognition error occurred');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechRecognitionAvailable, language]);

  const handleStopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleImportSubtitlesFromText = useCallback(() => {
    if (!transcriptText.trim()) {
      setError('No text to convert to subtitles');
      return;
    }

    // Split text into sentences and create subtitle entries
    const sentences = transcriptText.split(/[.!?]+/).filter((s) => s.trim());
    const avgDuration = 3; // seconds per subtitle

    const entries: SubtitleEntry[] = sentences.map((sentence, index) => ({
      id: uuidv4(),
      startTime: index * avgDuration,
      endTime: (index + 1) * avgDuration,
      text: sentence.trim(),
    }));

    setSubtitleEntries(entries);
  }, [transcriptText]);

  const handleAddToTimeline = useCallback(() => {
    if (subtitleEntries.length === 0) {
      setError('No subtitles to add');
      return;
    }

    const totalDuration = subtitleEntries.reduce((max, entry) =>
      Math.max(max, entry.endTime), 0
    );

    onCreateSubtitleClip(subtitleEntries, totalDuration);
    setSubtitleEntries([]);
    setTranscriptText('');
  }, [subtitleEntries, onCreateSubtitleClip]);

  const handleEditSubtitle = useCallback((id: string, text: string) => {
    setSubtitleEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, text } : entry))
    );
  }, []);

  const handleDeleteSubtitle = useCallback((id: string) => {
    setSubtitleEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const handleAdjustTiming = useCallback((id: string, field: 'startTime' | 'endTime', value: number) => {
    setSubtitleEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Speech to Text / Subtitles</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">Language</h3>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full h-8 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
            disabled={isRecording}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="it-IT">Italian</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="zh-CN">Chinese (Simplified)</option>
          </select>
        </div>

        {/* Recording Controls */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">
            Live Speech Recognition
          </h3>
          {!speechRecognitionAvailable ? (
            <p className="text-xs text-yellow-500">
              Speech recognition is not available in this environment
            </p>
          ) : (
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-sm bg-white"></span>
                  Stop Recording
                </button>
              )}
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Recording... Speak now
            </div>
          )}
        </div>

        {/* Manual Text Input */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-editor-text-secondary uppercase">
            Manual Text Input
          </h3>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Type or paste transcript text here, or use speech recognition above..."
            className="w-full h-24 px-2 py-1 bg-editor-panel border border-editor-border rounded text-sm resize-none focus:outline-none focus:border-editor-accent"
            disabled={isRecording}
          />
          <button
            onClick={handleImportSubtitlesFromText}
            className="w-full px-3 py-1.5 bg-editor-accent hover:bg-editor-accent/80 text-white rounded text-sm"
            disabled={!transcriptText.trim() || isRecording}
          >
            Generate Subtitles from Text
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Subtitle Entries */}
        {subtitleEntries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-editor-text-secondary uppercase">
                Subtitle Entries ({subtitleEntries.length})
              </h3>
              <button
                onClick={handleAddToTimeline}
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
              >
                Add to Timeline
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-auto">
              {subtitleEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-2 bg-editor-panel border border-editor-border rounded space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-editor-text-secondary">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtitle(entry.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-editor-text-secondary">In:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={entry.startTime.toFixed(1)}
                        onChange={(e) =>
                          handleAdjustTiming(entry.id, 'startTime', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-5 px-1 bg-editor-bg border border-editor-border rounded text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-editor-text-secondary">Out:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={entry.endTime.toFixed(1)}
                        onChange={(e) =>
                          handleAdjustTiming(entry.id, 'endTime', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-5 px-1 bg-editor-bg border border-editor-border rounded text-right"
                      />
                    </div>
                  </div>
                  <textarea
                    value={entry.text}
                    onChange={(e) => handleEditSubtitle(entry.id, e.target.value)}
                    className="w-full h-12 px-1 py-0.5 bg-editor-bg border border-editor-border rounded text-sm resize-none focus:outline-none focus:border-editor-accent"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Subtitle Track Button */}
        <div className="pt-2 border-t border-editor-border">
          <button
            onClick={onAddSubtitleTrack}
            className="w-full px-3 py-2 bg-editor-surface hover:bg-editor-border text-editor-text rounded text-sm border border-editor-border"
          >
            + Add Subtitle Track to Timeline
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtitlePanel;
