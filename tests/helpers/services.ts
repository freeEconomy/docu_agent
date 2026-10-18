import { createServer, type IncomingMessage } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
export const testBlobToken = 'vercel_blob_rw_teststore_test-only-not-a-real-token';
export const testDatabaseUrl = 'postgresql://test:test@ep-local.neon.tech/test?sslmode=require';
async function body(req: IncomingMessage) {
  const parts: Buffer[] = [];
  for await (const part of req) parts.push(Buffer.from(part));
  return Buffer.concat(parts);
}
export async function startServices(directory: string, port = 0) {
  const db = new PGlite(path.join(directory, 'postgres'));
  await db.exec(await readFile(path.resolve('migrations/001_neon.sql'), 'utf8'));
  const blobs = new Map<string, { data: Buffer; type: string }>();
  function metadata(name: string, entry: { data: Buffer; type: string }) {
    return {
      url: `https://teststore.private.blob.vercel-storage.com/${name}`,
      downloadUrl: `https://teststore.private.blob.vercel-storage.com/${name}?download=1`,
      pathname: name,
      size: entry.data.length,
      contentType: entry.type,
      contentDisposition: 'attachment',
      cacheControl: 'private, no-store',
      uploadedAt: new Date().toISOString(),
      etag: 'test-etag',
    };
  }
  function raw(result: any) {
    return {
      fields: result.fields,
      rows: result.rows.map((row: any) =>
        result.fields.map((f: any) => {
          const value = row[f.name];
          return value === null
            ? null
            : value instanceof Date
              ? value.toISOString().replace('T', ' ').replace('Z', '+00')
              : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
        }),
      ),
      rowCount: result.affectedRows || result.rows.length,
      command: 'SELECT',
    };
  }
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://127.0.0.1');
    function json(value: unknown, status = 200) {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(value));
    }
    try {
      if (url.pathname === '/health') {
        json({ ok: true });
        return;
      }
      if (url.pathname === '/neon') {
        const input = JSON.parse((await body(req)).toString());
        if (input.queries) {
          const results = await db.transaction(async (tx) => {
            const results = [];
            for (const q of input.queries) results.push(raw(await tx.query(q.query, q.params)));
            return results;
          });
          json({ results });
        } else json(raw(await db.query(input.query, input.params)));
        return;
      }
      if (url.pathname === '/blob-api/delete' && req.method === 'POST') {
        if (req.headers.authorization !== `Bearer ${testBlobToken}`) {
          json({}, 403);
          return;
        }
        const input = JSON.parse((await body(req)).toString());
        for (const name of input.urls) blobs.delete(name);
        json({});
        return;
      }
      if (url.pathname.startsWith('/blob-api') && req.method === 'PUT') {
        const name = url.searchParams.get('pathname')!;
        const authorization = req.headers.authorization?.slice(7) || '';
        if (authorization.startsWith('vercel_blob_client_teststore_')) {
          const decoded = Buffer.from(
            authorization.slice('vercel_blob_client_teststore_'.length),
            'base64',
          ).toString();
          const index = decoded.indexOf('.');
          const signature = decoded.slice(0, index);
          const payload = decoded.slice(index + 1);
          const expected = createHmac('sha256', testBlobToken).update(payload).digest('hex');
          const signed = JSON.parse(Buffer.from(payload, 'base64').toString());
          if (
            signature !== expected ||
            signed.pathname !== name ||
            signed.validUntil < Date.now()
          ) {
            json({ error: { code: 'forbidden' } }, 403);
            return;
          }
          const bytes = await body(req);
          if (
            bytes.length > signed.maximumSizeInBytes ||
            !signed.allowedContentTypes.includes(req.headers['x-content-type'])
          ) {
            json({ error: { code: 'forbidden' } }, 403);
            return;
          }
          if (blobs.has(name) && !signed.allowOverwrite) {
            json({ error: { code: 'blob_already_exists' } }, 409);
            return;
          }
          blobs.set(name, { data: bytes, type: String(req.headers['x-content-type']) });
        } else if (authorization === testBlobToken) {
          blobs.set(name, {
            data: await body(req),
            type: String(req.headers['x-content-type'] || 'application/octet-stream'),
          });
        } else {
          json({ error: { code: 'forbidden' } }, 403);
          return;
        }
        json(metadata(name, blobs.get(name)!));
        return;
      }
      if (url.pathname === '/blob-api' && req.method === 'GET') {
        if (req.headers.authorization !== `Bearer ${testBlobToken}`) {
          json({}, 403);
          return;
        }
        const name = url.searchParams.get('url')!;
        const entry = blobs.get(name);
        if (!entry) {
          json({ error: { code: 'not_found' } }, 404);
          return;
        }
        json(metadata(name, entry));
        return;
      }
      if (url.pathname.startsWith('/raw/')) {
        if (req.headers.authorization !== `Bearer ${testBlobToken}`) {
          json({}, 403);
          return;
        }
        const entry = blobs.get(decodeURIComponent(url.pathname.slice(5)));
        if (!entry) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': entry.type,
          'Content-Length': entry.data.length,
          etag: 'test-etag',
        });
        res.end(entry.data);
        return;
      }
      json({ error: 'unknown test route' }, 404);
    } catch (error) {
      json(
        {
          message: error instanceof Error ? error.message : 'Test service failed',
          code: (error as { code?: string }).code,
        },
        400,
      );
    }
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  return {
    db,
    blobs,
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((r) => server.close(() => r()));
      await db.close();
    },
  };
}
