const getToken = () => localStorage.getItem('adminToken');
const setToken = (t) => localStorage.setItem('adminToken', t);
const clearAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminEmail');
};

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

async function apiMultipart(path, fields, filePath = null) {
  const opts = {
    method: 'POST', path,
    token: getToken(),
    isMultipart: true, 
    fields,
    filePath
  };
  const res = await window.electron.apiRequest(opts);
  if (res.status >= 400) {
    const msg = res.data?.msg || res.data?.errors?.[0]?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.data;
}

async function apiMultipartFiles(method, path, fields, filePaths = [], fileFieldName = 'reportImages') {
  const opts = {
    method, path,
    token: getToken(),
    isMultipart: true,
    fields,
    filePaths,
    fileFieldName
  };
  const res = await window.electron.apiRequest(opts);
  if (res.status >= 400) {
    const msg = res.data?.msg || res.data?.errors?.[0]?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.data;
}
