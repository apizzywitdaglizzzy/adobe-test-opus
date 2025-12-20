/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1a1a1a',
        'editor-surface': '#252525',
        'editor-panel': '#2d2d2d',
        'editor-border': '#3d3d3d',
        'editor-accent': '#0078d4',
        'editor-accent-hover': '#1084d8',
        'editor-text': '#ffffff',
        'editor-text-secondary': '#a0a0a0',
        'editor-timeline': '#1e1e1e',
        'track-video': '#4a9eff',
        'track-audio': '#4caf50',
        'track-effect': '#ff9800',
        'clip-selected': '#0078d4',
      },
      fontFamily: {
        'editor': ['Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
