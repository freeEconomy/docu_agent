import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { zipSync, strToU8 } from 'fflate';
import { chunkText, parseDocument } from '../lib/ingestion';
import { validateFile } from '../lib/documents';

const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const docA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const conversationA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

test('migration executes in PostgreSQL with real RLS, ownership and atomic ingestion', async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    // Minimal hosted Auth/Storage contracts; application migration and policies are unchanged.
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema storage; create schema extensions;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,storage,extensions to authenticated,anon;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
      grant select,insert,delete on storage.objects to authenticated;
      insert into auth.users values ('${userA}'),('${userB}');`);
    await db.exec(
      await readFile(
        new URL('../supabase/migrations/202610180001_documind.sql', import.meta.url),
        'utf8',
      ),
    );
    async function asUser(id: string) {
      await db.exec('reset role; set role authenticated;');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    }
    await asUser(userA);
    await t.test('new accounts contain no seeded documents, chunks or turns', async () => {
      for (const table of ['documents', 'document_chunks', 'conversations', 'chat_turns'])
        assert.equal(
          (await db.query<{ n: number }>(`select count(*)::int n from ${table}`)).rows[0].n,
          0,
        );
    });
    await db.query(
      'insert into documents(id,name,file_type,size_bytes,storage_path) values($1,$2,$3,$4,$5)',
      [docA, '보안 규정.txt', 'TXT', 100, `${userA}/${docA}/original.txt`],
    );
    let token = '';
    await t.test('processing claims prevent duplicate concurrent ingestion', async () => {
      token = (
        await db.query<{ token: string }>('select begin_document_processing($1) token', [docA])
      ).rows[0].token;
      await assert.rejects(
        () => db.query('select begin_document_processing($1)', [docA]),
        /already processing/,
      );
    });
    const text = '정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.';
    await t.test('extracted chunks and ready state commit together', async () => {
      await db.query('select finish_document_processing($1,$2,$3,0,$4)', [
        docA,
        token,
        text,
        [text],
      ]);
      const rows = (
        await db.query<{ status: string; chunk_count: number }>(
          'select status,chunk_count from documents',
        )
      ).rows;
      assert.equal(rows[0].status, 'ready');
      assert.equal(rows[0].chunk_count, 1);
    });
    await t.test(
      'Korean retrieval returns real source text and no unrelated fallback',
      async () => {
        const hits = await db.query<{ content: string; document_id: string }>(
          "select * from search_document_chunks('보안',null)",
        );
        assert.equal(hits.rows[0].content, text);
        assert.equal(hits.rows[0].document_id, docA);
        assert.equal(
          (await db.query("select * from search_document_chunks('zzzzxyz',null)")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from search_document_chunks('보안',array[]::uuid[])")).rows
            .length,
          0,
        );
      },
    );
    await db.query('insert into conversations(id,title) values($1,$2)', [
      conversationA,
      '보안 질문',
    ]);
    await db.query(
      "insert into chat_turns(conversation_id,question,answer,mode) values($1,'보안','계정을 회수합니다.','extractive')",
      [conversationA],
    );
    await db.query("insert into storage.objects(bucket_id,name) values('documents',$1)", [
      `${userA}/${docA}/original.txt`,
    ]);
    await asUser(userB);
    await t.test(
      'a second account cannot read documents, chunks, conversations, turns or original objects',
      async () => {
        for (const table of [
          'documents',
          'document_chunks',
          'conversations',
          'chat_turns',
          'storage.objects',
        ])
          assert.equal((await db.query(`select * from ${table}`)).rows.length, 0, table);
        assert.equal(
          (await db.query("select * from search_document_chunks('보안',null)")).rows.length,
          0,
        );
      },
    );
    await t.test('cross-account document and Storage writes are denied', async () => {
      await assert.rejects(
        () =>
          db.query(
            'insert into documents(user_id,name,file_type,size_bytes,storage_path) values($1,$2,$3,1,$4)',
            [userA, 'bad.txt', 'TXT', `${userA}/${docA}/original.txt`],
          ),
        /row-level security/,
      );
      await assert.rejects(
        () =>
          db.query("insert into storage.objects(bucket_id,name) values('documents',$1)", [
            `${userA}/bad.txt`,
          ]),
        /row-level security/,
      );
      await assert.rejects(
        () => db.query('select begin_document_processing($1)', [docA]),
        /unavailable/,
      );
      assert.equal(
        (await db.query('delete from documents where id=$1 returning id', [docA])).rows.length,
        0,
      );
    });
    await t.test('foreign keys reject chunks and turns attached to another owner', async () => {
      await assert.rejects(
        () =>
          db.query(
            "insert into document_chunks(document_id,position,content) values($1,100,'bad')",
            [docA],
          ),
        /foreign key/,
      );
      await assert.rejects(
        () =>
          db.query(
            "insert into chat_turns(conversation_id,question,answer,mode) values($1,'bad','bad','extractive')",
            [conversationA],
          ),
        /foreign key/,
      );
    });
    await asUser(userA);
    await t.test(
      'failed replacement rolls back chunk deletion and excludes failed documents from retrieval',
      async () => {
        const claim = (
          await db.query<{ token: string }>('select begin_document_processing($1) token', [docA])
        ).rows[0].token;
        await assert.rejects(
          () =>
            db.query('select finish_document_processing($1,$2,$3,0,$4)', [
              docA,
              claim,
              'x'.repeat(1201),
              ['x'.repeat(1201)],
            ]),
          /check constraint/,
        );
        assert.equal((await db.query('select content from document_chunks')).rows.length, 1);
        await db.query(
          "select finish_document_processing($1,$2,'',0,array[]::text[],'Parsing failed')",
          [docA, claim],
        );
        assert.equal(
          (await db.query("select * from search_document_chunks('보안',null)")).rows.length,
          0,
        );
        await assert.rejects(
          () =>
            db.query('select finish_document_processing($1,$2,$3,0,$4)', [
              docA,
              claim,
              text,
              [text],
            ]),
          /claim expired/,
        );
      },
    );
    await t.test('deleting a document cascades its chunks', async () => {
      await db.query('delete from documents where id=$1', [docA]);
      assert.equal((await db.query('select * from document_chunks')).rows.length, 0);
    });
    await t.test('anonymous database and RPC access is denied', async () => {
      await db.exec('reset role;set role anon;');
      await assert.rejects(() => db.query('select * from documents'), /permission denied/);
      await assert.rejects(
        () => db.query("select * from search_document_chunks('보안',null)"),
        /permission denied/,
      );
    });
  } finally {
    await db.close();
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
    const result = await parseDocument(strToU8(pdf), 'PDF');
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
