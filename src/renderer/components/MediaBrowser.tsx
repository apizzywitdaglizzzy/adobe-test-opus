import React, { useState } from 'react';
import { MediaItem, Bin } from '../../types';

interface MediaBrowserProps {
  mediaItems: MediaItem[];
  bins: Bin[];
  selectedMedia: string[];
  onSelectMedia: (ids: string[]) => void;
  onAddToTimeline: (item: MediaItem) => void;
  onImportMedia: () => void;
}

const MediaBrowser: React.FC<MediaBrowserProps> = ({
  mediaItems,
  bins,
  selectedMedia,
  onSelectMedia,
  onAddToTimeline,
  onImportMedia,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'image'>('all');

  const filteredMedia = mediaItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getTypeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border">
        <span className="text-sm font-medium">Project Media</span>
        <div className="flex items-center gap-1">
          <button
            className={`p-1 rounded ${viewMode === 'list' ? 'bg-editor-accent' : 'hover:bg-editor-border'}`}
            onClick={() => setViewMode('list')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>
          <button
            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-editor-accent' : 'hover:bg-editor-border'}`}
            onClick={() => setViewMode('grid')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="p-2 space-y-2">
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-7 px-2 bg-editor-panel border border-editor-border rounded text-sm focus:outline-none focus:border-editor-accent"
        />
        <div className="flex gap-1">
          {(['all', 'video', 'audio', 'image'] as const).map((type) => (
            <button
              key={type}
              className={`px-2 h-6 rounded text-xs capitalize ${
                filterType === type
                  ? 'bg-editor-accent text-white'
                  : 'bg-editor-panel text-editor-text-secondary hover:text-editor-text'
              }`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Media list */}
      <div className="flex-1 overflow-auto p-2">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-editor-text-secondary">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <p className="text-sm">No media files</p>
            <button
              className="mt-2 px-4 h-8 bg-editor-accent rounded text-sm hover:bg-editor-accent-hover transition-colors"
              onClick={onImportMedia}
            >
              Import Media
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={`relative rounded overflow-hidden cursor-pointer transition-all ${
                  selectedMedia.includes(item.id)
                    ? 'ring-2 ring-editor-accent'
                    : 'hover:ring-1 hover:ring-editor-border'
                }`}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    onSelectMedia(
                      selectedMedia.includes(item.id)
                        ? selectedMedia.filter((id) => id !== item.id)
                        : [...selectedMedia, item.id]
                    );
                  } else {
                    onSelectMedia([item.id]);
                  }
                }}
                onDoubleClick={() => onAddToTimeline(item)}
              >
                <div className="aspect-video bg-editor-panel flex items-center justify-center">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`text-2xl ${
                      item.type === 'video' ? 'text-track-video' :
                      item.type === 'audio' ? 'text-track-audio' : 'text-track-effect'
                    }`}>
                      {getTypeIcon(item.type)}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                  <p className="text-xs truncate">{item.name}</p>
                  <p className="text-xs text-editor-text-secondary">{formatDuration(item.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedMedia.includes(item.id)
                    ? 'bg-editor-accent'
                    : 'hover:bg-editor-panel'
                }`}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    onSelectMedia(
                      selectedMedia.includes(item.id)
                        ? selectedMedia.filter((id) => id !== item.id)
                        : [...selectedMedia, item.id]
                    );
                  } else {
                    onSelectMedia([item.id]);
                  }
                }}
                onDoubleClick={() => onAddToTimeline(item)}
              >
                <div className={`${
                  item.type === 'video' ? 'text-track-video' :
                  item.type === 'audio' ? 'text-track-audio' : 'text-track-effect'
                }`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.name}</p>
                  <p className="text-xs text-editor-text-secondary">
                    {formatDuration(item.duration)} • {formatFileSize(item.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import button */}
      <div className="p-2 border-t border-editor-border">
        <button
          className="w-full h-8 bg-editor-accent rounded text-sm hover:bg-editor-accent-hover transition-colors flex items-center justify-center gap-2"
          onClick={onImportMedia}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import Media
        </button>
      </div>
    </div>
  );
};

export default MediaBrowser;
