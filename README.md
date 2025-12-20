# Pro Video Editor

A professional-grade desktop video editing application built with Electron, React, and TypeScript. Designed to provide an Adobe Premiere-like experience with a modern, intuitive interface.

## Features

### Core Editing
- **Multi-track Timeline**: Support for unlimited video and audio tracks
- **Clip Management**: Drag, drop, trim, split, and arrange clips
- **Real-time Preview**: Preview your edits with transport controls
- **Snapping**: Intelligent snapping for precise edits

### Professional Tools
- **Selection Tool (V)**: Select and move clips
- **Razor Tool (C)**: Split clips at any point
- **Slip Tool (Y)**: Adjust clip content without moving position
- **Slide Tool (U)**: Move clips while maintaining adjacent edits
- **Ripple Edit (B)**: Edit that automatically closes gaps
- **Rolling Edit (N)**: Adjust edit points between clips
- **Hand Tool (H)**: Pan the timeline
- **Zoom Tool (Z)**: Zoom in/out on timeline

### Video Effects
- Gaussian Blur
- Sharpen
- Brightness & Contrast
- Saturation
- Hue Shift
- RGB Curves
- Color Balance
- Vignette
- Film Grain
- Chromatic Aberration

### Audio Effects
- Gain
- Compressor
- Parametric EQ
- Reverb
- Delay
- De-Esser
- Noise Reduction

### Transitions
- Cross Dissolve
- Dip to Black/White
- Wipe (Left, Right, Up, Down)
- Slide
- Zoom In/Out

### Export Options
- Multiple format support (MP4, MOV, WebM, AVI, GIF)
- Preset configurations for YouTube, Instagram, TikTok, Twitter
- Custom resolution and frame rate
- Adjustable bitrate and quality settings

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/pro-video-editor.git
cd pro-video-editor

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

## Development

### Tech Stack
- **Electron**: Cross-platform desktop application
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **Tailwind CSS**: Utility-first styling

### Project Structure
```
pro-video-editor/
├── src/
│   ├── main/           # Electron main process
│   │   └── main.ts     # Main entry point
│   ├── renderer/       # React application
│   │   ├── components/ # React components
│   │   ├── styles/     # CSS styles
│   │   ├── App.tsx     # Main app component
│   │   └── main.tsx    # Renderer entry
│   └── types/          # TypeScript definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Key Components
- **Timeline**: Multi-track editing timeline with playhead
- **Preview**: Real-time video preview with transport controls
- **MediaBrowser**: Import and organize media files
- **EffectsPanel**: Apply video/audio effects and transitions
- **PropertiesPanel**: Adjust clip properties and parameters

## Keyboard Shortcuts

### Playback
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Enter | Stop |
| Home | Go to Start |
| End | Go to End |
| ← / → | Previous/Next Frame |
| I / O | Set In/Out Point |

### Tools
| Key | Tool |
|-----|------|
| V | Selection |
| C | Razor |
| Y | Slip |
| U | Slide |
| B | Ripple Edit |
| N | Rolling Edit |
| H | Hand |
| Z | Zoom |

### Editing
| Key | Action |
|-----|--------|
| Ctrl/Cmd + K | Split Clip |
| Delete | Delete Selected |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| S | Toggle Snapping |

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.
