const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

const SERVER_DIR = path.join(__dirname, '..', 'server');
const SERVER_PORT = 5000;
const API_BASE = `http://localhost:${SERVER_PORT}`;
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');
// ─── Server Management ────────────────────────────────────────────────────────
/*
function startServer() {
  console.log('[Main] Starting server from:', SERVER_DIR);
  serverProcess = spawn('node', ['server.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('[Server]', data.toString().trim());
  });
  serverProcess.stderr.on('data', (data) => {
    console.error('[Server ERR]', data.toString().trim());
  });
  serverProcess.on('close', (code) => {
    console.log('[Main] Server process exited with code:', code);
  });
}
*/
function waitForServer(retries = 10, interval = 1000) {
    return new Promise((resolve, reject) => {
        const attempt = (n) => {
            http.get(`${API_BASE}/api/auth`, () => {
                resolve();
            }).on('error', () => {
                if (n <= 0) {
                    reject(new Error('Немає відповіді від сервера (таймаут 10 секунд)'));
                } else {
                    setTimeout(() => attempt(n - 1), interval);
                }
            });
        };
        attempt(retries);
    });
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 900,
        minHeight: 600,
        title: 'ImpactPulse — Admin Panel',
        backgroundColor: '#0f1117',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
    // startServer();
    createWindow();

    // Notify renderer when server is ready
    waitForServer()
        .then(() => {
            if (mainWindow) mainWindow.webContents.send('server-ready');
        })
        .catch((err) => {
            console.error('[Main] Server wait error:', err.message);
            if (mainWindow) mainWindow.webContents.send('server-error', err.message);
        });
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (serverProcess) serverProcess.kill();
});

// ─── IPC – HTTP Bridge ────────────────────────────────────────────────────────
// The renderer cannot use Node's http directly (contextIsolation + no nodeIntegration),
// so we relay all API calls through main via IPC.

const https = require('https');

function doRequest({ method, path: apiPath, token, body, isMultipart, boundary, rawBody }) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_BASE}${apiPath}`);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const headers = {};
        if (token) headers['x-auth-token'] = token;

        if (isMultipart && boundary) {
            headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        } else if (body && !isMultipart) {
            headers['Content-Type'] = 'application/json';
        }

        const bodyBuffer = rawBody
            ? Buffer.from(rawBody, 'base64')
            : body
                ? Buffer.from(JSON.stringify(body))
                : null;

        if (bodyBuffer) headers['Content-Length'] = bodyBuffer.length;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method || 'GET',
            headers
        };

        const req = lib.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString();
                let data;
                try { data = JSON.parse(raw); } catch { data = raw; }
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', reject);
        if (bodyBuffer) req.write(bodyBuffer);
        req.end();
    });
}

ipcMain.handle('api-request', async (_event, opts) => {
    try {
        const result = await doRequest(opts);
        return result;
    } catch (err) {
        return { status: 500, data: { msg: err.message } };
    }
});

// File open dialog for proof/task files
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'All Files', extensions: ['*'] },
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
            { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
        ]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});
