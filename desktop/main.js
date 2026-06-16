const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

const fs = require('fs');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const SERVER_PORT = 5000;

// Try to load and parse environment variables from server/.env if available
let envServerUrl = '';
try {
  const envPath = path.join(SERVER_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    const envVars = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value.trim();
      }
    }
    // Prioritize VITE_API_URL (active deployed server) over other URL variables
    envServerUrl = envVars.VITE_API_URL || envVars.SERVER_URL || envVars.BASE_URL || '';
  }
} catch (err) {
  console.error('[Main] Failed to parse server/.env:', err);
}

// Allow overriding server URL via environment variable for production (e.g., Render URL)
const SERVER_URL = process.env.SERVER_URL || envServerUrl || `http://127.0.0.1:${SERVER_PORT}`;
const API_BASE = SERVER_URL;
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
// Deprecated waitForServer: Desktop app now assumes server is reachable via SERVER_URL.
// If needed, you can implement a ping here, but we proceed without waiting.
function waitForServer() {
  return Promise.resolve();
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

    // Wait for the DOM to be ready, then give renderer scripts a moment
    // to register their IPC listeners before we fire 'server-ready'.
    // 'did-finish-load' can fire before async <script> tags are evaluated,
    // so we use 'dom-ready' + a small delay as a safer alternative.
    mainWindow.webContents.once('dom-ready', () => {
        setTimeout(() => {
            if (mainWindow) mainWindow.webContents.send('server-ready');
        }, 300);
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

function doRequest({ method, path: apiPath, token, body, fields, filePath, filePaths, fileFieldName, isMultipart }) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_BASE}${apiPath}`);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const headers = {};
        if (token) headers['x-auth-token'] = token;

        let bodyBuffer = null;

        if (isMultipart) {
            const boundary = '----ImpactPulseBoundary' + Date.now();
            headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
            const CRLF = '\r\n';
            const parts = [];

            for (const [key, val] of Object.entries(fields || {})) {
                if (val === null || val === undefined || val === '') continue;
                parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}${val}${CRLF}`));
            }

            if (filePath) {
                try {
                    const fileContent = fs.readFileSync(filePath);
                    const fileName = path.basename(filePath);
                    const fileField = apiPath.includes('/shop') ? 'image' : 'taskFile';
                    
                    let mimeType = 'application/octet-stream';
                    const ext = path.extname(fileName).toLowerCase();
                    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                    else if (ext === '.png') mimeType = 'image/png';
                    else if (ext === '.gif') mimeType = 'image/gif';
                    else if (ext === '.webp') mimeType = 'image/webp';
                    else if (ext === '.pdf') mimeType = 'application/pdf';

                    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${fileField}"; filename="${fileName}"${CRLF}Content-Type: ${mimeType}${CRLF}${CRLF}`));
                    parts.push(fileContent);
                    parts.push(Buffer.from(CRLF));
                } catch (e) {
                    console.error('Failed to read file:', e);
                }
            }

            // Support multiple file uploads via filePaths array
            const multiFiles = filePaths || [];
            const fieldName = fileFieldName || 'files';
            for (const fp of multiFiles) {
                try {
                    const fileContent = fs.readFileSync(fp);
                    const fileName = path.basename(fp);
                    let mimeType = 'application/octet-stream';
                    const ext = path.extname(fileName).toLowerCase();
                    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                    else if (ext === '.png') mimeType = 'image/png';
                    else if (ext === '.gif') mimeType = 'image/gif';
                    else if (ext === '.webp') mimeType = 'image/webp';
                    else if (ext === '.pdf') mimeType = 'application/pdf';

                    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${CRLF}Content-Type: ${mimeType}${CRLF}${CRLF}`));
                    parts.push(fileContent);
                    parts.push(Buffer.from(CRLF));
                } catch (e) {
                    console.error('Failed to read file:', fp, e);
                }
            }

            parts.push(Buffer.from(`--${boundary}--${CRLF}`));
            bodyBuffer = Buffer.concat(parts);
        } else if (body) {
            headers['Content-Type'] = 'application/json';
            bodyBuffer = Buffer.from(JSON.stringify(body));
        }

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

// Multi-file open dialog for report images
ipcMain.handle('open-files-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
        ]
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    return result.filePaths.slice(0, 5); // Max 5 images
});
