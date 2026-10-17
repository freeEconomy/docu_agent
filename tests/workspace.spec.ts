import { test, expect, type Page } from '@playwright/test';
const project = 'https://uyckuziyzjqterrsgvhg.supabase.co';
const userId = '11111111-1111-4111-8111-111111111111';
const docId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const conversationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const token = [
  { alg: 'HS256', typ: 'JWT' },
  {
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  'test-signature',
]
  .map((v) => (typeof v === 'string' ? v : Buffer.from(JSON.stringify(v)).toString('base64url')))
  .join('.');
const session = {
  access_token: token,
  refresh_token: 'test-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: userId,
    email: 'member@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: '테스트 사용자' },
    created_at: '2026-10-17T00:00:00Z',
  },
};
type Doc = {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  storage_path: string;
  status: string;
  chunk_count: number;
  page_count: number;
  category: string;
  created_at: string;
  error_message: null;
};
async function backend(page: Page, authenticated = true) {
  let docs: Doc[] = [];
  let conversation = false;
  const calls: { uploads: number; deletions: number; tokens: number } = {
    uploads: 0,
    deletions: 0,
    tokens: 0,
  };
  const contents = '정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.';
  const citation = {
    document_id: docId,
    document_name: '보안.txt',
    chunk_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    position: 0,
    content: contents,
  };
  if (authenticated)
    await page.addInitScript(
      ({ session }) => {
        localStorage.setItem('sb-uyckuziyzjqterrsgvhg-auth-token', JSON.stringify(session));
      },
      { session },
    );
  await page.route(project + '/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let data: unknown = [];
    let headers: Record<string, string> = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'content-range': '0-0/0',
    };
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 200, headers });
      return;
    }
    if (url.pathname.endsWith('/auth/v1/token')) {
      calls.tokens++;
      data = session;
    } else if (url.pathname.endsWith('/auth/v1/user')) data = session.user;
    else if (url.pathname.includes('/auth/v1/logout')) data = {};
    else if (url.pathname.includes('/rest/v1/documents')) {
      if (req.method() === 'POST') {
        const row = req.postDataJSON();
        docs = [
          {
            ...row,
            status: 'processing',
            chunk_count: 0,
            page_count: 0,
            category: '미분류',
            created_at: '2026-10-17T00:00:00Z',
            error_message: null,
          },
          ...docs,
        ];
        data = null;
      } else if (req.method() === 'PATCH') {
        docs = docs.map((d) => ({ ...d, ...req.postDataJSON() }));
        data = { id: docs[0]?.id };
      } else if (req.method() === 'DELETE') {
        docs = [];
        calls.deletions++;
      } else if (url.searchParams.get('select') === 'extracted_text')
        data = { extracted_text: contents };
      else data = docs;
    } else if (url.pathname.includes('/rest/v1/document_chunks'))
      data = docs.length
        ? [{ id: citation.chunk_id, document_id: docs[0].id, position: 0, content: contents }]
        : [];
    else if (url.pathname.includes('/rest/v1/conversations'))
      data = conversation ? [{ id: conversationId, title: '보안 규정은?' }] : [];
    else if (url.pathname.includes('/rest/v1/chat_turns')) {
      data = conversation
        ? [
            {
              id: 'turn-1',
              question: '보안 규정은?',
              answer: contents,
              citations: [{ ...citation, document_id: docs[0]?.id || docId }],
              mode: 'extractive',
              created_at: '2026-10-17T00:00:00Z',
            },
          ]
        : [];
      headers['content-range'] = conversation ? '0-0/1' : '*/0';
    } else if (url.pathname.includes('/storage/v1/object/sign/'))
      data = { signedURL: '/object/sign/documents/test?token=test' };
    else if (url.pathname.includes('/storage/v1/object/')) {
      calls.uploads++;
      data = { Key: 'documents/test', Id: 'object-id' };
    }
    await route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
  await page.route('**/api/documents/*/process', async (route) => {
    docs = docs.map((d) => ({ ...d, status: 'ready', chunk_count: 1 }));
    await route.fulfill({ json: { chunks: 1, pages: 0 } });
  });
  await page.route('**/api/chat', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.question).toBeTruthy();
    conversation = true;
    await route.fulfill({
      json: {
        id: 'turn-1',
        conversationId,
        question: payload.question,
        answer: contents,
        citations: [{ ...citation, document_id: docs[0]?.id || docId }],
        mode: 'extractive',
      },
    });
  });
  return { calls };
}

test('anonymous users must log in and public server APIs reject unauthenticated requests', async ({
  page,
  request,
}) => {
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('button', { name: '워크스페이스 로그인', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('입력 없이 데모 바로 체험하기')).toHaveCount(0);
  for (const url of ['/api/chat', `/api/documents/${docId}/process`]) {
    const response = await request.post(url, { data: { question: '보안' } });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toContain('로그인');
  }
});

test('email login calls Supabase Auth and opens a genuinely empty workspace', async ({ page }) => {
  const { calls } = await backend(page, false);
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일', exact: true }).fill('member@example.com');
  await page.getByLabel('비밀번호', { exact: true }).fill('Password123!');
  await page.getByRole('button', { name: '워크스페이스 로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: '먼저 문서를 업로드하세요' })).toBeVisible();
  expect(calls.tokens).toBe(1);
  await expect(page.getByRole('button', { name: '질문하기', exact: true })).toBeDisabled();
});

test('empty account has zero documents, zero dashboard usage and no sample documents', async ({
  page,
}) => {
  await backend(page);
  await page.goto('/documents');
  await expect(page.getByRole('heading', { name: '아직 등록한 문서가 없습니다' })).toBeVisible();
  await expect(page.getByText('2024_경영계획서_Q3.pdf')).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.getByText('아직 질문 내역이 없습니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '지식 베이스 대시보드' })).toBeVisible();
});

test('upload persists through reload, renders extracted chunks, stores cited conversation and deletes document', async ({
  page,
}) => {
  const { calls } = await backend(page);
  await page.goto('/documents');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: '보안.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.'),
  });
  await expect(page.getByRole('link', { name: /보안.txt/ }).first()).toBeVisible();
  await expect(page.getByText('● 인덱싱 완료됨')).toBeVisible();
  expect(calls.uploads).toBe(1);
  await page.reload();
  await page.getByRole('link', { name: '상세보기' }).click();
  await expect(page.getByRole('heading', { name: '보안.txt', exact: true })).toBeVisible();
  await expect(page.locator('.real-document-text')).toContainText('즉시 회수');
  await expect(page.getByLabel('청크 선택')).toHaveValue('0');
  await page.getByRole('button', { name: '정보 수정' }).click();
  await page.getByLabel('문서 이름').fill('보안 정책.txt');
  await page.getByRole('button', { name: '변경 저장' }).click();
  await expect(page.getByRole('heading', { name: '보안 정책.txt' })).toBeVisible();
  await page.goto('/chat');
  await page.getByLabel('질문 입력').fill('보안 규정은?');
  await page.getByRole('button', { name: '질문하기', exact: true }).click();
  await expect(page.getByText('원문 발췌', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /\[1\] 보안.txt/ })).toBeVisible();
  await page.reload();
  await page.getByLabel('저장된 대화').selectOption(conversationId);
  await expect(page.getByText('원문 발췌', { exact: true })).toBeVisible();
  await page.goto('/documents');
  await page.getByRole('button', { name: '보안 정책.txt 삭제' }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByRole('heading', { name: '아직 등록한 문서가 없습니다' })).toBeVisible();
  expect(calls.deletions).toBe(1);
});

test('upload format validation rejects unsupported files before network upload', async ({
  page,
}) => {
  const { calls } = await backend(page);
  await page.goto('/documents');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('bad'),
  });
  await expect(page.getByRole('status')).toContainText('지원하지 않는 파일 형식');
  expect(calls.uploads).toBe(0);
});

test('database setup failures show an error and retry, never fabricate documents', async ({
  page,
}) => {
  await backend(page);
  await page.route(project + '/rest/v1/documents**', (route) =>
    route.fulfill({
      status: 404,
      json: {
        code: 'PGRST205',
        message: "Could not find the table 'public.documents' in the schema cache",
      },
    }),
  );
  await page.goto('/documents');
  await expect(page.locator('.backend-notice')).toContainText('테이블이 아직 설치되지 않았습니다');
  await expect(page.getByRole('button', { name: '파일 찾아보기', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: '설치 안내', exact: true }).click();
  await expect(page.getByRole('heading', { name: '최초 데이터베이스 설치' })).toBeVisible();
});

test('workspace pages fit desktop and mobile viewports with working navigation', async ({
  page,
  isMobile,
}) => {
  await backend(page);
  for (const path of ['/chat', '/documents', '/admin', '/settings', '/documents/not-found']) {
    await page.goto(path);
    await expect(page.locator('.app-shell')).toBeVisible();
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.inner + 1);
  }
  if (isMobile) {
    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await page.getByRole('link', { name: /AI 채팅/ }).click();
    await expect(page).toHaveURL(/\/chat$/);
  }
});

test('signup submits to Supabase and waits for email confirmation without a fake session', async ({
  page,
}) => {
  await backend(page, false);
  let submitted = false;
  await page.route(project + '/auth/v1/signup**', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.email).toBe('new@example.com');
    expect(payload.password).toBe('StrongPass123!');
    expect(payload.data.company).toBe('테스트 기업');
    submitted = true;
    await route.fulfill({ json: session.user });
  });
  await page.goto('/signup');
  await page.getByLabel('이름 및 직책 *', { exact: true }).fill('새 사용자');
  await page.getByLabel('업무용 이메일 주소 *', { exact: true }).fill('new@example.com');
  await page.getByLabel('소속 기업 / 기관명 *', { exact: true }).fill('테스트 기업');
  await page.getByPlaceholder('8자 이상', { exact: true }).fill('StrongPass123!');
  await page.getByPlaceholder('비밀번호 재입력').fill('Mismatch123!');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await expect(page.locator('.error-box')).toContainText('비밀번호가 일치하지 않습니다');
  await page.getByPlaceholder('비밀번호 재입력').fill('StrongPass123!');
  await page.getByRole('checkbox', { name: '약관 전체 동의하기' }).check();
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByLabel('기업 도메인 *', { exact: true }).fill('example.com');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByRole('checkbox', { name: '계정 및 문서 저장 안내를 확인했습니다.' }).check();
  await page.getByRole('button', { name: '계정 만들기' }).click();
  await expect(page.getByText('확인 이메일을 보냈습니다.', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
  expect(submitted).toBe(true);
});

test('recovery link enables password update through Supabase Auth', async ({ page }) => {
  await backend(page, false);
  let changed = false;
  await page.route(project + '/auth/v1/user', async (route) => {
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON().password).toBe('NewPassword123!');
      changed = true;
    }
    await route.fulfill({ json: session.user });
  });
  await page.goto(
    '/reset-password#access_token=' +
      token +
      '&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=recovery',
  );
  await expect(page.getByRole('button', { name: '비밀번호 변경' })).toBeEnabled();
  await page.getByLabel('새 비밀번호', { exact: true }).fill('NewPassword123!');
  await page.getByLabel('비밀번호 확인', { exact: true }).fill('NewPassword123!');
  await page.getByRole('button', { name: '비밀번호 변경' }).click();
  await expect(page).toHaveURL(/\/chat$/);
  expect(changed).toBe(true);
});
