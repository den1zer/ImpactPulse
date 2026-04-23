// ── Token helpers ────────────────────────────────────────
const getToken  = () => localStorage.getItem('adminToken');
const setToken  = (t) => localStorage.setItem('adminToken', t);
const clearAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminEmail');
};

// ── API wrapper ──────────────────────────────────────────
// Sends a request through IPC bridge (window.electron.apiRequest)
async function api(method, path, body = null) {
  const opts = { method, path, token: getToken() };
  if (body) opts.body = body;
  const res = await window.electron.apiRequest(opts);
  if (res.status >= 400) {
    const msg = res.data?.msg || res.data?.errors?.[0]?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.data;
}

// ── Multipart helper ─────────────────────────────────────
// Sends multipart/form-data via Node's http in main process.
// Fields: plain object. filePath: absolute local path (optional).
async function apiMultipart(path, fields, filePath = null) {
  const boundary = '----ImpactPulseBoundary' + Date.now();
  const CRLF = '\r\n';

  let body = '';
  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || val === '') continue;
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}`;
    body += `${val}${CRLF}`;
  }

  if (filePath) {
    const fs = null; // cannot use fs directly in renderer
    // We pass filePath as a special field; main process handles it
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="__filePath__"${CRLF}${CRLF}`;
    body += `${filePath}${CRLF}`;
  }
  body += `--${boundary}--${CRLF}`;

  const rawBody = btoa(unescape(encodeURIComponent(body)));
  const opts = {
    method: 'POST', path,
    token: getToken(),
    isMultipart: true, boundary,
    rawBody
  };
  const res = await window.electron.apiRequest(opts);
  if (res.status >= 400) {
    const msg = res.data?.msg || res.data?.errors?.[0]?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.data;
}
