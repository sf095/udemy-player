const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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
