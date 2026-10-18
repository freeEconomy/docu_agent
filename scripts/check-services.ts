import './load-env.mjs';
import { getDb } from '../lib/server/db';
import { list } from '@vercel/blob';
async function main() {
  const db = getDb();
  const [row] = await db.query<{ version: number }>(
    'SELECT max(version)::integer version FROM documind_schema_versions',
  );
  if (row?.version !== 1) throw new Error();
  console.log('PASS Neon connection and schema version 1');
  // Listing metadata does not upload a document or create a test user.
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error();
  await list({ limit: 1 });
  console.log(
    'PASS Blob authentication and list request (private-store configuration must also be checked in Vercel)',
  );
}
void main().catch(() => {
  console.error(
    'Service check failed. Verify DATABASE_URL, BLOB_READ_WRITE_TOKEN, migration and network access. Secrets were not printed.',
  );
  process.exitCode = 1;
});
