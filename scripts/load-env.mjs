import { existsSync } from 'node:fs';
import path from 'node:path';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
for (const name of ['.env.local', '.env']) {
  const file = path.resolve(name);
  if (existsSync(file)) process.loadEnvFile(file);
}

// Operator commands in Codex must use its credential-aware HTTPS proxy.
// Keep loopback services direct so isolated PostgreSQL/Blob tests still work.
if (
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy
) {
  const noProxy = [process.env.NO_PROXY || process.env.no_proxy, 'localhost', '127.0.0.1', '[::1]']
    .filter(Boolean)
    .join(',');
  setGlobalDispatcher(new EnvHttpProxyAgent({ noProxy }));
}
