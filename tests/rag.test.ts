import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import type { Database, Row } from '../lib/server/db';
import {
  prepareRag,
  ragAnswer,
  hybridSearch,
  embedTexts,
  reserveUsage,
  normalizeVector,
  topicChunks,
  selectEvidence,
} from '../lib/server/rag';
import { embeddingVersion } from '../lib/server/rag-provider';
import { answerQuestion, sourcePassages } from '../lib/server/answer';
import { queryFocus } from '../lib/server/query-focus';
import { searchChunks } from '../lib/server/repository';
import { mockEmbedding, mockAnswer } from './helpers/mock-ai';

test('low cost RAG: semantic retrieval, exact quotes, ownership, cache and atomic budgets', async (t) => {
  const pg = new PGlite();
  const fetchBefore = globalThis.fetch;
  const envKeys = [
    'GEMINI_API_KEY',
    'RAG_API_KEY',
    'RAG_DAILY_QUESTIONS',
    'RAG_GLOBAL_DAILY_QUESTIONS',
    'RAG_DAILY_EMBEDDING_CHARACTERS',
    'RAG_GLOBAL_DAILY_EMBEDDING_CHARACTERS',
  ];
  const old = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  process.env.GEMINI_API_KEY = 'test-only-not-real';
  delete process.env.RAG_API_KEY;
  for (const k of envKeys.slice(2)) delete process.env[k];
  const db: Database = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query(text, params)).rows as T[];
    },
    async transaction(statements) {
      return pg.transaction(async (tx) => {
        const rows: Row[][] = [];
        for (const s of statements)
          rows.push((await tx.query(s.text, s.params || [])).rows as Row[]);
        return rows;
      });
    },
  };
  let embeddingRequests = 0,
    answerRequests = 0,
    badSource = false,
    refusal = false,
    providerFailure = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    assert.ok(url.startsWith('https://generativelanguage.googleapis.com/v1beta/'));
    const body = JSON.parse(String(init?.body));
    if (providerFailure) return Response.json({ error: 'test' }, { status: 429 });
    if (url.endsWith(':batchEmbedContents')) {
      embeddingRequests++;
      assert.equal(body.requests[0].outputDimensionality, 512);
      assert.ok(body.requests.length <= 32);
      return Response.json({
        embeddings: body.requests.map((r: { content: { parts: { text: string }[] } }) => ({
          values: mockEmbedding(r.content.parts[0].text),
        })),
      });
    }

    answerRequests++;
    assert.equal(body.generationConfig.maxOutputTokens, 900);
    assert.ok(JSON.parse(body.contents[0].parts[0].text).excerpts.length <= 40);
    const reply = (value: unknown) =>
      Response.json({
        candidates: [
          { finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } },
        ],
      });
    if (refusal) return reply({ supported: false, answer: 'untrusted ignored', sources: [] });
    if (badSource)
      return reply({
        supported: true,
        statements: [{ text: '답변', sources: [99999] }],
      });
    return Response.json(mockAnswer(body));
  };
  const user = randomUUID(),
    other = randomUUID(),
    doc = randomUUID(),
    foreignDoc = randomUUID();
  const content = '협력사 계정은 프로젝트 종료 시 즉시 회수합니다.';
  try {
    for (const f of [
      '001_neon.sql',
      '002_google_sso.sql',
      '003_low_cost_rag.sql',
      '003_low_cost_rag.sql',
    ])
      await pg.exec(await readFile('migrations/' + f, 'utf8'));
    for (const [id, email] of [
      [user, 'a@example.com'],
      [other, 'b@example.com'],
    ])
      await db.query("INSERT INTO users(id,email,name) VALUES($1,$2,'RAG test')", [id, email]);
    for (const [id, uid, text] of [
      [doc, user, content],
      [foreignDoc, other, '다른 사용자의 계정은 절대 공개하지 않습니다.'],
    ]) {
      await db.query(
        "INSERT INTO documents(id,user_id,name,file_type,size_bytes,blob_path,status) VALUES($1,$2,'policy.txt','TXT',100,$3,'ready')",
        [id, uid, `${uid}/${id}/original.txt`],
      );
      await db.query(
        'INSERT INTO document_chunks(id,document_id,user_id,position,content) VALUES($1,$2,$3,0,$4)',
        [randomUUID(), id, uid, text],
      );
    }
    await t.test(
      'missing key produces configuration error, never a raw document answer',
      async () => {
        delete process.env.GEMINI_API_KEY;
        await assert.rejects(ragAnswer(db, user, '질문'), /AI 답변 설정/);
        assert.equal(embeddingRequests, 0);
        process.env.GEMINI_API_KEY = 'test-only-not-real';
      },
    );
    await t.test(
      'indexed text is embedded once, repeat preparation and question embeddings are reused',
      async () => {
        assert.deepEqual(await prepareRag(db, user), { processed: 1, hasMore: false });
        const n = embeddingRequests;
        await prepareRag(db, user);
        assert.equal(embeddingRequests, n);
        const map = await embedTexts(db, user, ['접근권한을 없애야 하는 시점은?']);
        assert.equal(map.size, 1);
        await embedTexts(db, user, ['접근권한을 없애야 하는 시점은?']);
        assert.equal(embeddingRequests, n + 1);
      },
    );
    await t.test(
      'real SQL cosine search finds a paraphrase without lexical matches and isolates owner and selected documents',
      async () => {
        const q = '접근권한을 없애야 하는 시점은?';
        assert.equal((await searchChunks(db, user, q)).length, 0);
        const found = await hybridSearch(db, user, q, mockEmbedding(q));
        assert.equal(found[0].document_id, doc);
        assert.equal((await hybridSearch(db, user, q, mockEmbedding(q), [foreignDoc])).length, 0);
        assert.equal((await hybridSearch(db, other, q, mockEmbedding(q))).length, 0);
        assert.equal(
          (await db.query('SELECT * FROM rag_embeddings WHERE user_id=$1', [other])).length,
          0,
        );
      },
    );
    await t.test(
      'section heading with Korean spacing and polite wording beats generic keyword distractors',
      async () => {
        assert.equal(queryFocus('시설 현황에 대해서 알려줘'), '시설현황');
        assert.equal(queryFocus('시설현황을 알려주세요.'), '시설현황');
        assert.equal(queryFocus('시설 현황에 대해 설명해 주세요'), '시설현황');
        assert.equal(queryFocus('시설'), '');
        const facilityId = randomUUID();
        const facility =
          '1-2 시설현황\n- 시설기준 준수\n생활실 사무실 의료/\n간호사실 프로그램실 물리(작업)\n치료실 식당/\n조리실 화장실\n○ ○ ○ ○ ○ ○';
        await db.query(
          'INSERT INTO document_chunks(id,document_id,user_id,position,content) VALUES($1,$2,$3,1,$4)',
          [facilityId, doc, user, facility],
        );
        for (let i = 2; i < 15; i++)
          await db.query(
            'INSERT INTO document_chunks(id,document_id,user_id,position,content) VALUES($1,$2,$3,$4,$5)',
            [
              randomUUID(),
              doc,
              user,
              i,
              '시설 운영 시설 점검 시설 관리 시설 안전 시설 교육. '.repeat(5),
            ],
          );
        const anchors = await topicChunks(db, user, '시설 현황에 대해서 알려줘', [doc]);
        assert.equal(anchors[0].chunk_id, facilityId);
        const distractors = await searchChunks(db, user, '시설 현황에 대해서 알려줘', [doc]);
        const chosen = selectEvidence([], distractors, anchors);
        assert.equal(chosen[0].chunk_id, facilityId);
        assert.ok(chosen[0].content.includes('간호사실'));
        assert.equal((await topicChunks(db, other, '시설 현황에 대해서 알려줘', [doc])).length, 0);
        assert.equal(
          (await topicChunks(db, user, '시설 현황에 대해서 알려줘', [foreignDoc])).length,
          0,
        );
        assert.equal((await topicChunks(db, user, '시설 현황에 대해서 알려줘', [])).length, 0);
        await db.query('DELETE FROM document_chunks WHERE document_id=$1 AND position>0', [doc]);
      },
    );
    await t.test(
      'answer cites an exact short substring, repeats consume no extra provider calls or budget',
      async () => {
        const q = '접근권한을 없애야 하는 시점은?';
        const first = await ragAnswer(db, user, q);
        assert.equal(first.mode, 'generated');
        assert.equal(first.citations.length, 1);
        assert.ok(content.includes(first.citations[0].content));
        assert.ok(first.citations[0].content.length <= 220);
        assert.equal(first.cached, false);
        const counts = [embeddingRequests, answerRequests];
        const usage = await db.query('SELECT * FROM rag_usage ORDER BY scope');
        const second = await ragAnswer(db, user, q);
        assert.equal(second.cached, true);
        assert.deepEqual([embeddingRequests, answerRequests], counts);
        assert.deepEqual(await db.query('SELECT * FROM rag_usage ORDER BY scope'), usage);
      },
    );
    await t.test(
      'renaming/reindexing invalidates answers and deleted or foreign documents never resurrect cached evidence',
      async () => {
        const before = answerRequests;
        await db.query("UPDATE documents SET name='renamed.txt' WHERE id=$1", [doc]);
        const answer = await ragAnswer(db, user, '접근권한을 없애야 하는 시점은?');
        assert.equal(answer.cached, false);
        assert.equal(answerRequests, before + 1);
        assert.equal(answer.citations[0].document_name, 'renamed.txt');
        await db.query('UPDATE documents SET rag_revision=gen_random_uuid() WHERE id=$1', [doc]);
        assert.equal((await ragAnswer(db, user, '접근권한을 없애야 하는 시점은?')).cached, false);
        assert.equal(
          (await ragAnswer(db, other, '접근권한을 없애야 하는 시점은?', [doc])).citations.length,
          0,
        );
        await db.query('UPDATE documents SET deleted_at=now() WHERE id=$1', [doc]);
        assert.equal(
          (await ragAnswer(db, user, '접근권한을 없애야 하는 시점은?')).mode,
          'no_match',
        );
        await db.query('UPDATE documents SET deleted_at=NULL WHERE id=$1', [doc]);
      },
    );
    await t.test(
      'PDF table newlines and symbols are cited from server text without model transcription',
      async () => {
        const pdfText =
          '일반 안내\n'.repeat(22) +
          '1-2 시설현황\n- 시설기준 준수\n생활실 사무실 의료/\n간호사실 프로그램실 물리(작업)\n치료실 식당/\n조리실 화장실 세면장 및\n목욕실 세탁장\n건조장\n○ ○ ○ ○ ○ ○\n' +
          '후속 내용\n'.repeat(40);
        const citation = {
          document_id: doc,
          document_name: 'table.pdf',
          chunk_id: randomUUID(),
          position: 0,
          content: pdfText,
        };
        const passages = sourcePassages([citation]);
        assert.ok(passages.length > 1);
        assert.ok(passages.every((p) => p.content.length <= 220 && pdfText.includes(p.content)));
        assert.equal(passages.map((p) => p.content).join(''), pdfText);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async (_input, init) => {
          const body = JSON.parse(String(init?.body));
          assert.equal(
            'quote' in
              body.generationConfig.responseJsonSchema.properties.statements.items.properties,
            false,
          );
          const input = JSON.parse(body.contents[0].parts[0].text);
          const selected = input.excerpts.find((p: { text: string }) => p.text.includes('○'));
          assert.ok(selected);
          assert.ok(
            selected.text.includes('시설현황'),
            'Keep the section heading and short facility table together',
          );
          return Response.json({
            candidates: [
              {
                finishReason: 'STOP',
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        supported: true,
                        statements: [
                          {
                            text: '시설 항목은 표에 표시되어 있습니다 [99, 100].',
                            sources: [selected.source, selected.source],
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          });
        };
        try {
          const result = await answerQuestion('시설 현황에 대해서 알려줘', [citation]);
          assert.equal(result.mode, 'generated');
          assert.equal(result.citations.length, 1);
          assert.ok(result.citations[0].content.includes('○'));
          assert.ok(pdfText.includes(result.citations[0].content));
          assert.ok(result.answer.includes('[1]'));
        } finally {
          globalThis.fetch = originalFetch;
        }
      },
    );
    await t.test(
      'invented source IDs and invalid vectors are rejected, insufficient evidence has no raw-text fallback',
      async () => {
        const citations = await hybridSearch(db, user, '계정', mockEmbedding('계정'));
        badSource = true;
        await assert.rejects(answerQuestion('계정', citations), /출처 번호/);
        badSource = false;
        refusal = true;
        const result = await answerQuestion('계정', citations);
        assert.equal(result.mode, 'no_match');
        assert.equal(result.citations.length, 0);
        assert.ok(!result.answer.includes(content));
        refusal = false;
        assert.throws(() => normalizeVector([0]), /형식/);
        assert.throws(() => normalizeVector(Array(512).fill(0)), /유효한/);
        providerFailure = true;
        await assert.rejects(embedTexts(db, user, ['new text for failure']), /제공자의 사용 한도/);
        providerFailure = false;
      },
    );
    await t.test(
      'user and global daily limits are atomic and concurrent requests cannot exceed caps',
      async () => {
        await db.query('DELETE FROM rag_usage');
        process.env.RAG_DAILY_QUESTIONS = '1';
        const outcomes = await Promise.allSettled([
          reserveUsage(db, user, 1, 0),
          reserveUsage(db, user, 1, 0),
        ]);
        assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1);
        const global = await db.query<{ chat_requests: number }>(
          "SELECT chat_requests FROM rag_usage WHERE scope='global'",
        );
        assert.equal(global[0].chat_requests, 1);
        process.env.RAG_GLOBAL_DAILY_QUESTIONS = '1';
        await assert.rejects(reserveUsage(db, other, 1, 0), /오늘의 AI 사용 한도/);
        assert.equal(
          (await db.query('SELECT * FROM rag_usage WHERE scope=$1', ['user:' + other])).length,
          0,
        );
        process.env.RAG_DAILY_EMBEDDING_CHARACTERS = '10';
        await assert.rejects(reserveUsage(db, user, 0, 11), /오늘의 AI 사용 한도/);
      },
    );
  } finally {
    globalThis.fetch = fetchBefore;
    for (const k of envKeys) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
    await pg.close();
  }
});
