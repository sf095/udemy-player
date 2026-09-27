const { app, BrowserWindow, ipcMain, dialog, shell, Menu, MenuItem } = require('electron');
const path = require('path');
const net = require('net');

require('../backend/lib/path-env');

// Helper to find a free port recursively starting from startPort
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(findFreePort(startPort + 1));
    });
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    return !isLocal;
  } catch (e) {
    return false;
  }
}

let mainWindow;

async function startApp() {
  const port = app.isPackaged ? await findFreePort(3003) : 3003;

  // Set environment variables before requiring Express backend
  process.env.PORT = port;
  process.env.USER_DATA_PATH = app.getPath('userData');
  process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';
  if (app.isPackaged) {
    process.env.PACKAGED = 'true';
  }

  console.log(`Starting backend server on port ${port}...`);
  console.log(`User data path is ${process.env.USER_DATA_PATH}`);

  // Require Express app to spin it up in-process
  require('../backend/server.js');

  // Create BrowserWindow
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Udemy Offline Player',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isExternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('will-frame-navigate', (event, details) => {
    if (isExternalUrl(details.url)) {
      event.preventDefault();
      shell.openExternal(details.url);
    }
  });

  // Native context menu for text selection and editable inputs
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const menu = new Menu();

    // If text is selected (e.g. in Summary tab or notes)
    if (params.selectionText && params.selectionText.trim().length > 0) {
      menu.append(new MenuItem({ role: 'copy', label: 'Copy' }));
      menu.append(new MenuItem({ role: 'selectAll', label: 'Select All' }));
      menu.append(new MenuItem({ type: 'separator' }));

      const trimmed = params.selectionText.trim();
      if (process.platform === 'darwin') {
        const preview = trimmed.length > 25 ? trimmed.substring(0, 25) + '…' : trimmed;
        menu.append(new MenuItem({
          label: `Look Up "${preview}"`,
          click: () => mainWindow.webContents.showDefinitionForSelection()
        }));
      }

      menu.append(new MenuItem({
        label: 'Search with Google',
        click: () => {
          shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`);
        }
      }));

      menu.popup({ window: mainWindow, x: params.x, y: params.y });
      return;
    }

    // Editable text (inputs / textareas)
    if (params.isEditable) {
      menu.append(new MenuItem({ role: 'undo', label: 'Undo' }));
      menu.append(new MenuItem({ role: 'redo', label: 'Redo' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ role: 'cut', label: 'Cut' }));
      menu.append(new MenuItem({ role: 'copy', label: 'Copy' }));
      menu.append(new MenuItem({ role: 'paste', label: 'Paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ role: 'selectAll', label: 'Select All' }));
      menu.popup({ window: mainWindow, x: params.x, y: params.y });
      return;
    }
  });

  if (app.isPackaged) {
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    mainWindow.loadURL('http://127.0.0.1:3002');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Udemy Course Folder',
  });
  if (canceled) {
    return { cancelled: true };
  } else {
    return { selectedPath: filePaths[0] };
  }
});

ipcMain.handle('shell:showItemInFolder', async (_event, fullPath) => {
  if (!fullPath || typeof fullPath !== 'string') {
    return { success: false, error: 'Invalid path' };
  }
  shell.showItemInFolder(fullPath);
  return { success: true };
});

ipcMain.handle('shell:openPath', async (_event, fullPath) => {
  if (!fullPath || typeof fullPath !== 'string') {
    return { success: false, error: 'Invalid path' };
  }
  const err = await shell.openPath(fullPath);
  return { success: !err, error: err || null };
});

app.whenReady().then(startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startApp();
  }
});
