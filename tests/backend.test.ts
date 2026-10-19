import { neonConfig } from '@neondatabase/serverless';
import { DatabaseSync } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { chunkText, parseDocument } from '../lib/ingestion';
import { validateFile } from '../lib/documents';
import { createDatabase } from '../lib/server/db';
import {
  register,
  login,
  currentUser,
  logout,
  changePassword,
  sessionCookie,
} from '../lib/server/auth';
import {
  listDocuments,
  ownedDocument,
  beginProcessing,
  finishProcessing,
  searchChunks,
  saveTurn,
} from '../lib/server/repository';
import {
  prepareUpload,
  completeUpload,
  processDocument,
  deleteDocument,
  cleanupDeleted,
} from '../lib/server/documents';
import { readOriginal } from '../lib/server/blob-store';
import { checkOrigin, readJson } from '../lib/server/http';
import { startServices, testBlobToken, testDatabaseUrl } from './helpers/services';
import { installBlobRedirect } from './helpers/redirect-blob.mjs';

test('PostgreSQL over Neon HTTP protocol and private Blob SDK lifecycle', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'documind-neon-test-'));
  const services = await startServices(directory);
  const productionEndpoint = process.env.NEON_HTTP_ENDPOINT;
  delete process.env.NEON_HTTP_ENDPOINT;
  process.env.DOCUMIND_TEST_MODE = '1';
  process.env.DOCUMIND_TEST_NEON_URL = services.url + '/neon';
  process.env.BLOB_READ_WRITE_TOKEN = testBlobToken;
  process.env.VERCEL_BLOB_API_URL = services.url + '/blob-api';
  const undo = installBlobRedirect(services.url);
  const db = createDatabase(testDatabaseUrl);
  try {
    await t.test('same migration can run twice without deleting existing records', async () => {
      await db.query(await readFile('migrations/001_neon.sql', 'utf8'));
      assert.equal(
        (await db.query<{ n: number }>('SELECT count(*)::integer n FROM documents'))[0].n,
        0,
      );
    });
    await t.test(
      'proxy-bound connection strings are forwarded only to the specified Neon HTTPS endpoint',
      async () => {
        const endpoint = neonConfig.fetchEndpoint;
        const fetchFunction = neonConfig.fetchFunction;
        const oldEndpoint = process.env.NEON_HTTP_ENDPOINT;
        process.env.NEON_HTTP_ENDPOINT = 'https://api.us-east-2.aws.neon.tech/sql';
        try {
          neonConfig.fetchFunction = async (url: RequestInfo | URL, init?: RequestInit) => {
            assert.equal(url, 'https://api.us-east-2.aws.neon.tech/sql');
            assert.equal(
              new Headers(init?.headers).get('Neon-Connection-String'),
              'test-proxy-placeholder',
            );
            return fetch(services.url + '/neon', init);
          };
          const proxy = createDatabase('test-proxy-placeholder');
          assert.equal((await proxy.query<{ n: number }>('SELECT 42::integer n'))[0].n, 42);
          assert.equal((await proxy.transaction([{ text: 'SELECT 43::integer n' }]))[0][0].n, 43);
        } finally {
          neonConfig.fetchEndpoint = endpoint;
          neonConfig.fetchFunction = fetchFunction;
          if (oldEndpoint === undefined) delete process.env.NEON_HTTP_ENDPOINT;
          else process.env.NEON_HTTP_ENDPOINT = oldEndpoint;
        }
      },
    );
    const a = await register(db, { email: 'a@example.com', password: 'Password123!', name: 'A' });
    const b = await register(db, { email: 'b@example.com', password: 'Password123!', name: 'B' });
    const req = (token: string) =>
      new Request('https://example.com/api/documents', {
        headers: { Cookie: `documind_session=${token}` },
      });
    await t.test(
      'passwords and sessions are hashed and empty accounts contain no sample documents',
      async () => {
        assert.equal((await listDocuments(db, a.user.id)).length, 0);
        assert.equal((await currentUser(db, req(a.token)))?.id, a.user.id);
        const [row] = await db.query<{ password_hash: string }>(
          'SELECT password_hash FROM users WHERE id=$1',
          [a.user.id],
        );
        assert.match(row.password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
        assert.match(sessionCookie(req(a.token), a.token), /HttpOnly; SameSite=Lax/);
        assert.match(sessionCookie(req(a.token), a.token), /Secure/);
      },
    );
    await t.test('wrong credentials and invalid sessions are rejected', async () => {
      await assert.rejects(
        () => login(db, { email: 'a@example.com', password: 'WrongPassword' }),
        /이메일 또는 비밀번호/,
      );
      const logged = await login(db, { email: 'a@example.com', password: 'Password123!' });
      await logout(db, req(logged.token));
      assert.equal(await currentUser(db, req(logged.token)), null);
    });
    const text = '정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.';
    const bytes = Buffer.from(text);
    const doc = await prepareUpload(db, a.user.id, { name: '보안.txt', size: bytes.length });
    await t.test(
      'upload completion verifies provider metadata instead of trusting client URLs',
      async () => {
        await assert.rejects(
          () => completeUpload(db, a.user.id, doc.id),
          /원본을 찾을 수 없습니다/,
        );
        services.blobs.set(doc.pathname, { data: Buffer.from('wrong length'), type: 'text/plain' });
        await assert.rejects(() => completeUpload(db, a.user.id, doc.id), /크기가 일치/);
        services.blobs.set(doc.pathname, { data: bytes, type: 'text/plain' });
        await completeUpload(db, a.user.id, doc.id);
        assert.ok((await ownedDocument(db, a.user.id, doc.id)).uploaded_at);
      },
    );
    await t.test(
      'real parser text is stored and Korean FTS/substring retrieval returns real citations',
      async () => {
        await processDocument(db, a.user.id, doc.id);
        assert.equal((await ownedDocument(db, a.user.id, doc.id)).status, 'ready');
        const hits = await searchChunks(db, a.user.id, '보안');
        assert.equal(hits[0].content, text);
        assert.equal(hits[0].document_id, doc.id);
        assert.equal((await searchChunks(db, a.user.id, 'zzzzxyz')).length, 0);
        assert.equal((await searchChunks(db, a.user.id, '보안', [])).length, 0);
      },
    );
    await t.test(
      'chunked Blob responses are indexed using actual bytes and truncated originals are rejected',
      async () => {
        services.setBlobContentLength(false);
        try {
          assert.equal((await readOriginal(doc.pathname)).blob.size, 0);
          await processDocument(db, a.user.id, doc.id);
          assert.equal((await ownedDocument(db, a.user.id, doc.id)).status, 'ready');
          assert.equal((await searchChunks(db, a.user.id, '보안'))[0].content, text);
          services.blobs.set(doc.pathname, {
            data: bytes.subarray(0, bytes.length - 1),
            type: 'text/plain',
          });
          await assert.rejects(processDocument(db, a.user.id, doc.id));
          assert.equal((await ownedDocument(db, a.user.id, doc.id)).status, 'failed');
          services.blobs.set(doc.pathname, { data: bytes, type: 'text/plain' });
          await processDocument(db, a.user.id, doc.id);
        } finally {
          services.setBlobContentLength(true);
        }
      },
    );
    await t.test(
      'another account cannot read metadata, reprocess, delete or search the document',
      async () => {
        assert.equal((await listDocuments(db, b.user.id)).length, 0);
        assert.equal((await searchChunks(db, b.user.id, '보안')).length, 0);
        await assert.rejects(() => ownedDocument(db, b.user.id, doc.id), /찾을 수 없습니다/);
        await assert.rejects(() => processDocument(db, b.user.id, doc.id), /찾을 수 없습니다/);
        await assert.rejects(() => deleteDocument(db, b.user.id, doc.id), /찾을 수 없습니다/);
      },
    );
    await t.test(
      'processing locks and atomic replacement reject duplicate and stale workers',
      async () => {
        const token = await beginProcessing(db, a.user.id, doc.id);
        await assert.rejects(() => beginProcessing(db, a.user.id, doc.id), /분석 중/);
        await assert.rejects(
          () => finishProcessing(db, a.user.id, doc.id, token, 'x', 0, ['x'.repeat(1201)]),
          /크기/,
        );
        assert.equal((await searchChunks(db, a.user.id, '보안')).length, 0);
        await finishProcessing(db, a.user.id, doc.id, token, text, 0, [text]);
        await assert.rejects(
          () => finishProcessing(db, a.user.id, doc.id, token, text, 0, [text]),
          /만료/,
        );
      },
    );
    let conversationId = '';
    await t.test(
      'conversation and answer commit together and an account cannot append to another owner',
      async () => {
        const turn = await saveTurn(db, a.user.id, {
          question: '보안',
          answer: text,
          citations: await searchChunks(db, a.user.id, '보안'),
          mode: 'extractive',
        });
        conversationId = turn.conversationId;
        assert.ok(conversationId);
        await assert.rejects(
          () =>
            saveTurn(db, b.user.id, {
              conversationId,
              question: 'bad',
              answer: 'bad',
              citations: [],
              mode: 'extractive',
            }),
          /찾을 수 없습니다/,
        );
      },
    );
    await t.test(
      'independent client instances retain the same data and private originals',
      async () => {
        const another = createDatabase(testDatabaseUrl);
        assert.equal((await listDocuments(another, a.user.id)).length, 1);
        assert.equal((await searchChunks(another, a.user.id, '보안'))[0].content, text);
        const original = await readOriginal(doc.pathname);
        assert.equal(await new Response(original.stream).text(), text);
        assert.equal(
          (await db.query('SELECT id FROM chat_turns WHERE conversation_id=$1', [conversationId]))
            .length,
          1,
        );
      },
    );
    await t.test(
      'password changes reject wrong current password and revoke existing sessions',
      async () => {
        await assert.rejects(
          () =>
            changePassword(db, a.user, {
              currentPassword: 'WrongPassword',
              password: 'NewPassword123!',
            }),
          /일치하지/,
        );
        const token = await changePassword(db, a.user, {
          currentPassword: 'Password123!',
          password: 'NewPassword123!',
        });
        assert.equal(await currentUser(db, req(a.token)), null);
        assert.equal((await currentUser(db, req(token)))?.id, a.user.id);
        await assert.rejects(() => login(db, { email: 'a@example.com', password: 'Password123!' }));
      },
    );
    await t.test(
      'legacy SQLite import preserves credentials, originals, chunks and conversations and can resume',
      async () => {
        const legacy = path.join(directory, 'legacy');
        await mkdir(path.join(legacy, 'uploads'), { recursive: true });
        const file = new DatabaseSync(path.join(legacy, 'documind.sqlite'));
        const uid = randomUUID(),
          did = randomUUID(),
          cid = randomUUID();
        const [user] = await db.query('SELECT password_hash FROM users WHERE id=$1', [a.user.id]);
        const now = new Date().toISOString();
        file.exec(`CREATE TABLE users(id,email,name,company,password_hash,created_at);
        CREATE TABLE documents(id,user_id,name,file_type,size_bytes,category,status,chunk_count,page_count,extracted_text,error_message,created_at);
        CREATE TABLE document_chunks(id,document_id,user_id,position,content);
        CREATE TABLE conversations(id,user_id,title,created_at);
        CREATE TABLE chat_turns(id,user_id,conversation_id,question,answer,citations,mode,created_at);`);
        file
          .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
          .run(uid, 'legacy@example.com', '기존 사용자', '', String(user.password_hash), now);
        file
          .prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
          .run(
            did,
            uid,
            'legacy.txt',
            'TXT',
            bytes.length,
            '미분류',
            'ready',
            1,
            1,
            text,
            null,
            now,
          );
        file
          .prepare('INSERT INTO document_chunks VALUES(?,?,?,?,?)')
          .run(randomUUID(), did, uid, 0, text);
        file.prepare('INSERT INTO conversations VALUES(?,?,?,?)').run(cid, uid, '보안 질문', now);
        file
          .prepare('INSERT INTO chat_turns VALUES(?,?,?,?,?,?,?,?)')
          .run(randomUUID(), uid, cid, '보안', text, '[]', 'extractive', now);
        file.close();
        await writeFile(path.join(legacy, 'uploads', did), bytes);
        const args = ['--import', 'tsx', 'scripts/import-sqlite.ts', '--source', legacy];
        const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
        const run = promisify(execFile);
        const dry = await run(process.execPath, args, { env });
        assert.match(dry.stdout, /Dry run only/);
        assert.equal((await db.query('SELECT id FROM users WHERE id=$1', [uid])).length, 0);
        await run(process.execPath, [...args, '--apply'], { env });
        await run(process.execPath, [...args, '--apply'], { env });
        assert.equal(
          (await db.query('SELECT password_hash FROM users WHERE id=$1', [uid]))[0].password_hash,
          user.password_hash,
        );
        assert.equal((await searchChunks(db, uid, '보안'))[0].content, text);
        assert.equal(
          (await db.query('SELECT id FROM chat_turns WHERE conversation_id=$1', [cid])).length,
          1,
        );
        assert.equal(services.blobs.get(`${uid}/${did}/original.txt`)?.data.toString(), text);
        assert.equal((await readFile(path.join(legacy, 'uploads', did))).toString(), text);
      },
    );
    await t.test(
      'deletion hides document, removes chunks and original, and cleans late uploads after token expiry',
      async () => {
        await db.query('UPDATE documents SET upload_token_expires_at=$1 WHERE id=$2', [
          Date.now() + 60000,
          doc.id,
        ]);
        await deleteDocument(db, a.user.id, doc.id);
        assert.equal((await listDocuments(db, a.user.id)).length, 0);
        assert.equal(services.blobs.has(doc.pathname), false);
        assert.equal(
          (await db.query('SELECT id FROM document_chunks WHERE document_id=$1', [doc.id])).length,
          0,
        );
        services.blobs.set(doc.pathname, { data: bytes, type: 'text/plain' });
        await db.query('UPDATE documents SET upload_token_expires_at=$1 WHERE id=$2', [
          Date.now() - 120000,
          doc.id,
        ]);
        await cleanupDeleted(db, a.user.id);
        assert.equal(services.blobs.has(doc.pathname), false);
        assert.equal((await db.query('SELECT id FROM documents WHERE id=$1', [doc.id])).length, 0);
      },
    );
    await t.test(
      'cross-site writes, oversized JSON and missing production configuration fail clearly',
      async () => {
        assert.throws(
          () =>
            checkOrigin(
              new Request('https://example.com', { headers: { origin: 'https://evil.example' } }),
            ),
          /다른 사이트/,
        );
        await assert.rejects(
          () =>
            readJson(
              new Request('https://example.com', { method: 'POST', body: 'x'.repeat(17000) }),
            ),
          /너무 큽니다/,
        );
        assert.throws(() => createDatabase(''), /DATABASE_URL/);
      },
    );
  } finally {
    if (productionEndpoint === undefined) delete process.env.NEON_HTTP_ENDPOINT;
    else process.env.NEON_HTTP_ENDPOINT = productionEndpoint;
    undo();
    delete process.env.DOCUMIND_TEST_MODE;
    delete process.env.DOCUMIND_TEST_NEON_URL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_BLOB_API_URL;
    await services.close();
    await rm(directory, { recursive: true, force: true });
  }
});
test('text extraction, format limits and overlapping chunks', async (t) => {
  await t.test('UTF-8 Korean TXT is extracted without sample content', async () => {
    const result = await parseDocument(strToU8('사내 보안 규정\n계정을 회수합니다.'), 'TXT');
    assert.equal(result.text, '사내 보안 규정\n계정을 회수합니다.');
    assert.equal(result.pages, 0);
  });
  await t.test('chunks preserve all characters and overlap', () => {
    const original = '보안규정'.repeat(750);
    const chunks = chunkText(original);
    assert.ok(chunks.every((c) => c.length <= 1200));
    assert.equal(chunks[0].slice(-180), chunks[1].slice(0, 180));
    assert.equal(
      chunks[0] +
        chunks
          .slice(1)
          .map((c) => c.slice(180))
          .join(''),
      original,
    );
    assert.throws(() => chunkText(' \n '), /추출할 텍스트/);
    assert.throws(() => chunkText('x'.repeat(400001)), /40만 자/);
  });
  await t.test('HWPX section text is parsed without rendering XML or scripts', async () => {
    const zip = zipSync({
      'Contents/section0.xml': strToU8(
        '<hp:sec xmlns:hp="x"><hp:p><hp:run><hp:t>문서 보안 규정</hp:t></hp:run></hp:p></hp:sec>',
      ),
    });
    assert.equal((await parseDocument(zip, 'HWPX')).text, '문서 보안 규정');
    await assert.rejects(
      () => parseDocument(zipSync({ 'test.xml': strToU8('<x/>') }), 'HWPX'),
      /본문/,
    );
  });
  await t.test('DOCX extracts actual WordprocessingML paragraphs', async () => {
    const zip = zipSync({
      '[Content_Types].xml': strToU8(
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
      '_rels/.rels': strToU8(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      'word/document.xml': strToU8(
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>실제 문서 내용</w:t></w:r></w:p></w:body></w:document>',
      ),
    });
    assert.match((await parseDocument(zip, 'DOCX')).text, /실제 문서 내용/);
  });
  await t.test('PDF extracts source text from a real PDF stream', async () => {
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Length 47 >>\nstream\nBT /F1 12 Tf 50 750 Td (Document security) Tj ET\nendstream',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((o, i) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf);
    pdf +=
      `xref\n0 6\n0000000000 65535 f \n` +
      offsets
        .slice(1)
        .map((o) => String(o).padStart(10, '0') + ' 00000 n \n')
        .join('') +
      `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const result = await parseDocument(Buffer.from(pdf), 'PDF');
    assert.match(result.text, /Document security/);
    assert.equal(result.pages, 1);
  });
  await t.test(
    'unsupported, empty, oversized, malformed PDF and invalid UTF-8 files fail',
    async () => {
      assert.match(validateFile({ name: 'bad.exe', size: 100 })!, /지원하지/);
      assert.match(validateFile({ name: 'large.txt', size: 20 * 1024 * 1024 + 1 })!, /20MB/);
      assert.match(validateFile({ name: 'empty.txt', size: 0 })!, /빈 파일/);
      await assert.rejects(() => parseDocument(strToU8('<html>bad</html>'), 'PDF'), /올바른 PDF/);
      await assert.rejects(() => parseDocument(new Uint8Array([255, 255]), 'TXT'));
    },
  );
});
