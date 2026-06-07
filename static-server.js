const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 5173;
const root = path.join(__dirname, 'web', 'dist');

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  })
}

http.createServer((req,res) => {
  const url = req.url.split('?')[0];
  let filePath = path.join(root, url === '/' ? '/index.html' : url);
  const ext = path.extname(filePath).toLowerCase();
  const map = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
  const contentType = map[ext] || 'text/plain';
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return }
  if (fs.existsSync(filePath)) return sendFile(res, filePath, contentType);
  // SPA fallback
  filePath = path.join(root, 'index.html');
  if (fs.existsSync(filePath)) return sendFile(res, filePath, 'text/html');
  res.writeHead(404); res.end('Not found');
}).listen(PORT, ()=> console.log(`Static server serving web/ at http://localhost:${PORT}`));
