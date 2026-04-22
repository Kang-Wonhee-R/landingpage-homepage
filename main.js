const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 57321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.jpeg': 'image/jpeg',
  '.jpg':  'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.mov':  'video/quicktime',
  '.mp4':  'video/mp4',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function startServer() {
  const root = __dirname;
  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(root, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  server.listen(PORT);
  return server;
}

let server;

app.whenReady().then(() => {
  server = startServer();

  const win = new BrowserWindow({
    width: 960,
    height: 780,
    title: 'Admin — Atmosphere.note',
    webPreferences: { nodeIntegration: false },
  });

  win.loadURL(`http://localhost:${PORT}/admin.html`);
  win.setMenuBarVisibility(false);
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
