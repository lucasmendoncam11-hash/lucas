import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/tarefas.html', ['tarefas.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/tasks.js', ['tasks.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/game/', ['game/index.html', 'text/html; charset=utf-8']],
  ['/game/index.html', ['game/index.html', 'text/html; charset=utf-8']],
  ['/game/style.css', ['game/style.css', 'text/css; charset=utf-8']],
  ['/game/main.js', ['game/main.js', 'text/javascript; charset=utf-8']],
  ['/game/engine.js', ['game/engine.js', 'text/javascript; charset=utf-8']],
]);
const root = new URL('./', import.meta.url);

const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const entry = files.get(path);
  if (!entry || (request.method !== 'GET' && request.method !== 'HEAD')) {
    response.writeHead(404).end('Não encontrado');
    return;
  }
  try {
    const body = await readFile(new URL(entry[0], root));
    response.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('Erro ao carregar o arquivo');
  }
});

server.listen(port, host, () => {
  console.log(`Hoje disponível em http://localhost:${port}`);
});
