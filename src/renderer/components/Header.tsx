import React from 'react';
import { Project } from '../../types';

interface HeaderProps {
  project: Project;
}

const Header: React.FC<HeaderProps> = ({ project }) => {
  return (
    <div className="h-8 bg-editor-surface border-b border-editor-border flex items-center px-4 justify-between drag-region">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-editor-accent" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
          <span className="font-semibold text-sm">Pro Video Editor</span>
        </div>
        <div className="h-4 w-px bg-editor-border" />
        <span className="text-sm text-editor-text-secondary">
          {project.name}
          {project.path ? '' : ' (Unsaved)'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-editor-text-secondary">
          {project.settings.defaultSequenceSettings.width} x{' '}
          {project.settings.defaultSequenceSettings.height} @{' '}
          {project.settings.defaultSequenceSettings.frameRate}fps
        </span>
      </div>

      {/* Window controls for Windows/Linux */}
      {process.platform !== 'darwin' && (
        <div className="flex items-center gap-1 no-drag">
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-editor-panel transition-colors"
            onClick={() => window.require('electron').remote?.getCurrentWindow().minimize()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 10 1">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-editor-panel transition-colors"
            onClick={() => {
              const win = window.require('electron').remote?.getCurrentWindow();
              if (win?.isMaximized()) {
                win.unmaximize();
              } else {
                win?.maximize();
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={() => window.require('electron').remote?.getCurrentWindow().close()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
