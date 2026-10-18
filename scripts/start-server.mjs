import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
for (const filename of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  const filepath = path.join(root, filename);
  if (existsSync(filepath)) process.loadEnvFile(filepath);
}
const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}
process.env.PORT = option('--port', process.env.PORT || '3000');
process.env.HOSTNAME = option('--hostname', '0.0.0.0');
const server = path.join(root, '.next/standalone/server.js');
if (!existsSync(server)) throw new Error('먼저 npm run build를 실행하세요.');
await import(pathToFileURL(server).href);
