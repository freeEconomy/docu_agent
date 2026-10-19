import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startServices, testBlobToken, testDatabaseUrl } from './helpers/services';
async function main() {
  const directory = await mkdtemp(path.join(tmpdir(), 'documind-postgres-browser-'));
  const services = await startServices(directory, 3188);
  const child = spawn(
    process.execPath,
    [
      '--import',
      path.resolve('tests/helpers/redirect-blob.mjs'),
      'scripts/start-server.mjs',
      '--port',
      '3199',
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        NEON_HTTP_ENDPOINT: '',
        DOCUMIND_TEST_MODE: '1',
        DOCUMIND_TEST_NEON_URL: services.url + '/neon',
        BLOB_READ_WRITE_TOKEN: testBlobToken,
        VERCEL_BLOB_API_URL: services.url + '/blob-api',
        APP_ORIGIN: 'http://127.0.0.1:3199',
        RAG_API_KEY: '',
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        GOOGLE_WORKSPACE_DOMAINS: '',
        GOOGLE_ALLOW_PERSONAL_ACCOUNTS: 'false',
      },
    },
  );
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    child.kill('SIGTERM');
    await services.close();
    await rm(directory, { recursive: true, force: true });
  }
  process.on('SIGTERM', () => void close());
  process.on('SIGINT', () => void close());
  child.on('exit', (code) => {
    void close().then(() => process.exit(code || 0));
  });
}
void main();
