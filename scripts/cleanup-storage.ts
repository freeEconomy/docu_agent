import './load-env.mjs';
import { getDb } from '../lib/server/db';
import { cleanupDeleted } from '../lib/server/documents';
async function main() {
  const result = await cleanupDeleted(getDb());
  console.log(`Deleted ${result.removed} expired document tombstones and their originals.`);
}
void main().catch(() => {
  console.error('Storage cleanup failed. Check service connection and retry.');
  process.exitCode = 1;
});
