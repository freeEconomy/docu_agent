import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { chunkText, parseDocument } from '../lib/ingestion';
import { validateFile } from '../lib/documents';
import { openDatabase } from '../lib/server/db';
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
  uploadDocument,
  processDocument,
  deleteDocument,
  originalPath,
} from '../lib/server/documents';
import { checkOrigin, readJson } from '../lib/server/http';

test('real SQLite, original files, authentication, isolation and restart persistence', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'documind-db-test-'));
  let db = openDatabase(directory);
  try {
    const a = await register(db, {
      email: 'a@example.com',
      password: 'Password123!',
      name: '사용자 A',
    });
    const b = await register(db, {
      email: 'b@example.com',
      password: 'Password123!',
      name: '사용자 B',
    });
    const req = (token: string) =>
      new Request('http://localhost/api/documents', {
        headers: { cookie: `documind_session=${token}` },
      });
    await t.test(
      'registration starts with no documents or conversations and never stores plaintext passwords',
      () => {
        assert.equal(listDocuments(db, a.user.id).length, 0);
        assert.equal(db.prepare('SELECT count(*) n FROM conversations').get()?.n, 0);
        const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(a.user.id);
        assert.notEqual(row?.password_hash, 'Password123!');
        assert.match(String(row?.password_hash), /^[a-f0-9]{32}:[a-f0-9]{128}$/);
        assert.equal(currentUser(db, req(a.token))?.id, a.user.id);
        assert.equal(currentUser(db, req('bad')), null);
        assert.match(
          sessionCookie(new Request('https://example.com'), a.token),
          /HttpOnly; SameSite=Lax/,
        );
        assert.match(sessionCookie(new Request('https://example.com'), a.token), /Secure/);
      },
    );
    await t.test(
      'wrong credentials are rejected and valid credentials create a real session',
      async () => {
        await assert.rejects(
          () => login(db, { email: 'a@example.com', password: 'WrongPassword' }),
          /이메일 또는 비밀번호/,
        );
        const logged = await login(db, { email: 'a@example.com', password: 'Password123!' });
        assert.equal(currentUser(db, req(logged.token))?.id, a.user.id);
        logout(db, req(logged.token));
        assert.equal(currentUser(db, req(logged.token)), null);
      },
    );
    const source = '정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.';
    const doc = await uploadDocument(
      db,
      directory,
      a.user.id,
      new File([source], '보안.txt', { type: 'text/plain' }),
    );
    await t.test(
      'original upload, extraction and Korean retrieval use real files and SQLite FTS5',
      async () => {
        assert.equal(await readFile(originalPath(directory, doc.id), 'utf8'), source);
        await processDocument(db, directory, a.user.id, doc.id);
        assert.equal(ownedDocument(db, a.user.id, doc.id).status, 'ready');
        const hits = searchChunks(db, a.user.id, '보안');
        assert.equal(hits[0].content, source);
        assert.equal(hits[0].document_id, doc.id);
        assert.equal(searchChunks(db, a.user.id, 'zzzzxyz').length, 0);
        assert.equal(searchChunks(db, a.user.id, '보안', []).length, 0);
      },
    );
    await t.test(
      'another account cannot retrieve, process, or delete the original document',
      async () => {
        assert.equal(listDocuments(db, b.user.id).length, 0);
        assert.equal(searchChunks(db, b.user.id, '보안').length, 0);
        assert.throws(() => ownedDocument(db, b.user.id, doc.id), /찾을 수 없습니다/);
        await assert.rejects(
          () => processDocument(db, directory, b.user.id, doc.id),
          /찾을 수 없습니다/,
        );
        await assert.rejects(
          () => deleteDocument(db, directory, b.user.id, doc.id),
          /찾을 수 없습니다/,
        );
        assert.throws(
          () =>
            db
              .prepare('INSERT INTO document_chunks VALUES(?,?,?,?,?)')
              .run('bad', doc.id, b.user.id, 9, 'bad'),
          /FOREIGN KEY/,
        );
      },
    );
    await t.test('indexing locks reject duplicates and failed chunk replacements roll back', () => {
      const token = beginProcessing(db, a.user.id, doc.id);
      assert.throws(() => beginProcessing(db, a.user.id, doc.id), /분석 중/);
      assert.throws(
        () => finishProcessing(db, a.user.id, doc.id, token, 'bad', 0, ['x'.repeat(1201)]),
        /크기/,
      );
      assert.equal(
        db.prepare('SELECT count(*) n FROM document_chunks WHERE document_id=?').get(doc.id)?.n,
        1,
      );
      assert.equal(searchChunks(db, a.user.id, '보안').length, 0);
      finishProcessing(db, a.user.id, doc.id, token, source, 0, [source]);
      assert.throws(
        () => finishProcessing(db, a.user.id, doc.id, token, source, 0, [source]),
        /만료/,
      );
    });
    let conversationId = '';
    await t.test('conversation and turn are saved atomically and enforce ownership', () => {
      const turn = saveTurn(db, a.user.id, {
        question: '보안 규정은?',
        answer: source,
        citations: searchChunks(db, a.user.id, '보안'),
        mode: 'extractive',
      });
      conversationId = turn.conversationId;
      assert.ok(conversationId);
      assert.throws(
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
    });
    await t.test(
      'closing and reopening the database preserves sessions, documents, chunks, conversations and originals',
      async () => {
        db.close();
        db = openDatabase(directory);
        assert.equal(listDocuments(db, a.user.id).length, 1);
        assert.equal(searchChunks(db, a.user.id, '보안')[0].content, source);
        assert.equal(currentUser(db, req(a.token))?.id, a.user.id);
        assert.equal(
          db
            .prepare('SELECT count(*) n FROM chat_turns WHERE conversation_id=?')
            .get(conversationId)?.n,
          1,
        );
        assert.equal(await readFile(originalPath(directory, doc.id), 'utf8'), source);
      },
    );
    await t.test(
      'password change verifies the current password and revokes previous sessions',
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
        assert.equal(currentUser(db, req(a.token)), null);
        assert.equal(currentUser(db, req(token))?.id, a.user.id);
        await assert.rejects(() => login(db, { email: 'a@example.com', password: 'Password123!' }));
        assert.equal(
          (await login(db, { email: 'a@example.com', password: 'NewPassword123!' })).user.id,
          a.user.id,
        );
      },
    );
    await t.test(
      'deletion removes the original, cascades chunks and updates the FTS index',
      async () => {
        await deleteDocument(db, directory, a.user.id, doc.id);
        assert.equal(listDocuments(db, a.user.id).length, 0);
        assert.equal(db.prepare('SELECT count(*) n FROM document_chunks').get()?.n, 0);
        assert.equal(
          db.prepare("SELECT count(*) n FROM chunks_fts WHERE chunks_fts MATCH '보안'").get()?.n,
          0,
        );
        await assert.rejects(() => readFile(originalPath(directory, doc.id)));
      },
    );
    await t.test('cross-site writes and oversized JSON are rejected', async () => {
      assert.throws(
        () =>
          checkOrigin(
            new Request('http://localhost/api/auth/login', {
              headers: { origin: 'https://evil.example' },
            }),
          ),
        /다른 사이트/,
      );
      await assert.rejects(
        () =>
          readJson(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(17000) })),
        /너무 큽니다/,
      );
    });
  } finally {
    db.close();
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
