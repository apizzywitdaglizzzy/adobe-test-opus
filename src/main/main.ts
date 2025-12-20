import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-project'),
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenProject(),
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save-project'),
        },
        {
          label: 'Save Project As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => handleSaveProjectAs(),
        },
        { type: 'separator' },
        {
          label: 'Import Media',
          accelerator: 'CmdOrCtrl+I',
          click: () => handleImportMedia(),
        },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu-export'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Delete', accelerator: 'Delete', click: () => mainWindow?.webContents.send('menu-delete') },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        {
          label: 'Deselect All',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => mainWindow?.webContents.send('menu-deselect-all'),
        },
        { type: 'separator' },
        {
          label: 'Split Clip',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('menu-split-clip'),
        },
        {
          label: 'Ripple Delete',
          accelerator: 'Shift+Delete',
          click: () => mainWindow?.webContents.send('menu-ripple-delete'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu-zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu-zoom-out'),
        },
        {
          label: 'Fit to Window',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu-zoom-fit'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()),
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Playback',
      submenu: [
        {
          label: 'Play/Pause',
          accelerator: 'Space',
          click: () => mainWindow?.webContents.send('menu-play-pause'),
        },
        {
          label: 'Stop',
          accelerator: 'Enter',
          click: () => mainWindow?.webContents.send('menu-stop'),
        },
        { type: 'separator' },
        {
          label: 'Go to Start',
          accelerator: 'Home',
          click: () => mainWindow?.webContents.send('menu-go-start'),
        },
        {
          label: 'Go to End',
          accelerator: 'End',
          click: () => mainWindow?.webContents.send('menu-go-end'),
        },
        { type: 'separator' },
        {
          label: 'Previous Frame',
          accelerator: 'Left',
          click: () => mainWindow?.webContents.send('menu-prev-frame'),
        },
        {
          label: 'Next Frame',
          accelerator: 'Right',
          click: () => mainWindow?.webContents.send('menu-next-frame'),
        },
        { type: 'separator' },
        {
          label: 'Set In Point',
          accelerator: 'I',
          click: () => mainWindow?.webContents.send('menu-set-in'),
        },
        {
          label: 'Set Out Point',
          accelerator: 'O',
          click: () => mainWindow?.webContents.send('menu-set-out'),
        },
      ],
    },
    {
      label: 'Sequence',
      submenu: [
        {
          label: 'Add Video Track',
          click: () => mainWindow?.webContents.send('menu-add-video-track'),
        },
        {
          label: 'Add Audio Track',
          click: () => mainWindow?.webContents.send('menu-add-audio-track'),
        },
        { type: 'separator' },
        {
          label: 'Render Preview',
          accelerator: 'Enter',
          click: () => mainWindow?.webContents.send('menu-render-preview'),
        },
        {
          label: 'Delete Render Files',
          click: () => mainWindow?.webContents.send('menu-delete-render'),
        },
      ],
    },
    {
      label: 'Clip',
      submenu: [
        {
          label: 'Speed/Duration...',
          click: () => mainWindow?.webContents.send('menu-clip-speed'),
        },
        {
          label: 'Reverse Speed',
          click: () => mainWindow?.webContents.send('menu-clip-reverse'),
        },
        { type: 'separator' },
        {
          label: 'Unlink',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow?.webContents.send('menu-unlink'),
        },
        {
          label: 'Link',
          click: () => mainWindow?.webContents.send('menu-link'),
        },
        { type: 'separator' },
        {
          label: 'Enable/Disable',
          click: () => mainWindow?.webContents.send('menu-clip-enable'),
        },
      ],
    },
    {
      label: 'Effects',
      submenu: [
        {
          label: 'Video Effects',
          submenu: [
            { label: 'Blur', click: () => mainWindow?.webContents.send('menu-effect', 'blur') },
            { label: 'Sharpen', click: () => mainWindow?.webContents.send('menu-effect', 'sharpen') },
            { label: 'Color Correction', click: () => mainWindow?.webContents.send('menu-effect', 'color') },
            { label: 'Brightness/Contrast', click: () => mainWindow?.webContents.send('menu-effect', 'brightness') },
            { label: 'Saturation', click: () => mainWindow?.webContents.send('menu-effect', 'saturation') },
          ],
        },
        {
          label: 'Audio Effects',
          submenu: [
            { label: 'Gain', click: () => mainWindow?.webContents.send('menu-effect', 'gain') },
            { label: 'Equalizer', click: () => mainWindow?.webContents.send('menu-effect', 'eq') },
            { label: 'Compressor', click: () => mainWindow?.webContents.send('menu-effect', 'compressor') },
            { label: 'Reverb', click: () => mainWindow?.webContents.send('menu-effect', 'reverb') },
          ],
        },
        { type: 'separator' },
        {
          label: 'Transitions',
          submenu: [
            { label: 'Cross Dissolve', click: () => mainWindow?.webContents.send('menu-transition', 'dissolve') },
            { label: 'Dip to Black', click: () => mainWindow?.webContents.send('menu-transition', 'dip-black') },
            { label: 'Dip to White', click: () => mainWindow?.webContents.send('menu-transition', 'dip-white') },
            { label: 'Wipe', click: () => mainWindow?.webContents.send('menu-transition', 'wipe') },
            { label: 'Slide', click: () => mainWindow?.webContents.send('menu-transition', 'slide') },
          ],
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/pro-video-editor/docs'),
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow?.webContents.send('menu-show-shortcuts'),
        },
        { type: 'separator' },
        {
          label: 'About Pro Video Editor',
          click: () => mainWindow?.webContents.send('menu-about'),
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About Pro Video Editor', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: () => mainWindow?.webContents.send('menu-preferences') },
        { type: 'separator' },
        { label: 'Hide', role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function handleOpenProject(): Promise<void> {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Project',
    filters: [
      { name: 'Pro Video Editor Project', extensions: ['pvep'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const projectPath = result.filePaths[0];
    try {
      const data = fs.readFileSync(projectPath, 'utf8');
      mainWindow?.webContents.send('project-opened', { path: projectPath, data: JSON.parse(data) });
    } catch (error) {
      dialog.showErrorBox('Error', 'Failed to open project file');
    }
  }
}

async function handleSaveProjectAs(): Promise<void> {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save Project As',
    filters: [
      { name: 'Pro Video Editor Project', extensions: ['pvep'] },
    ],
    defaultPath: 'Untitled.pvep',
  });

  if (!result.canceled && result.filePath) {
    mainWindow?.webContents.send('save-project-as', result.filePath);
  }
}

async function handleImportMedia(): Promise<void> {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Media',
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'] },
      { name: 'All Media', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow?.webContents.send('media-imported', result.filePaths);
  }
}

// IPC Handlers
ipcMain.handle('show-open-dialog', async (_, options) => {
  return dialog.showOpenDialog(mainWindow!, options);
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  return dialog.showSaveDialog(mainWindow!, options);
});

ipcMain.handle('save-project', async (_, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-file', async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-file-info', async (_, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      info: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
