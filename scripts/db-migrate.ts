import './load-env.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDb } from '../lib/server/db';
async function main() {
  await getDb().query(await readFile(path.resolve('migrations/001_neon.sql'), 'utf8'));
  console.log('Neon schema version 1 installed. No sample accounts or documents inserted.');
}
void main().catch(() => {
  console.error(
    'Migration failed. Check DATABASE_URL, network access, database permissions and existing table names. No credential values were logged.',
  );
  process.exitCode = 1;
});
