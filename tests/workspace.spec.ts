import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test.beforeEach(async ({ page }) => {
  await page.route('https://vercel.com/api/blob/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: 'http://127.0.0.1:3188/blob-api' + url.pathname.slice('/api/blob'.length) + url.search,
    });
    await route.fulfill({ response });
  });
});
const password = 'Password123!';
async function account(page: Page) {
  const email = `${randomUUID()}@example.com`;
  const result = await page.request.post('/api/auth/register', {
    data: { email, password, name: '테스트 사용자', company: '테스트 기업' },
  });
  expect(result.status()).toBe(200);
  return { email, password };
}
async function upload(page: Page) {
  await page.goto('/documents');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: '보안.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('정보보안 규정: 외부 협력사 계정은 프로젝트 종료 시 즉시 회수합니다.'),
  });
  await expect(page.getByText('● 인덱싱 완료됨')).toBeVisible();
}

test('anonymous users are redirected and all private API resources reject access', async ({
  page,
  request,
}) => {
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/login$/);
  for (const route of ['/api/documents', '/api/conversations', '/api/dashboard', '/api/settings'])
    expect((await request.get(route)).status()).toBe(401);
  expect((await request.post('/api/chat', { data: { question: '보안' } })).status()).toBe(401);
});
test('real login, empty PostgreSQL state and logout', async ({ page, isMobile }) => {
  const user = await account(page);
  await page.request.post('/api/auth/logout');
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일', exact: true }).fill(user.email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '워크스페이스 로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: '먼저 문서를 업로드하세요' })).toBeVisible();
  await expect(page.getByRole('button', { name: '질문하기', exact: true })).toBeDisabled();
  await page.goto('/admin');
  await expect(page.getByText('아직 질문 내역이 없습니다.')).toBeVisible();
  const cookie = (await page.context().cookies()).find((c) => c.name === 'documind_session');
  expect(cookie?.httpOnly).toBe(true);
  await page.goto('/settings');
  if (isMobile) await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
test('real upload, reload, original download, rename, retrieval, conversation restore and deletion', async ({
  page,
}) => {
  await account(page);
  await upload(page);
  await page.reload();
  await page.getByRole('link', { name: '상세보기' }).click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]{36}$/);
  const documentId = new URL(page.url()).pathname.split('/').at(-1)!;
  await expect(page.locator('.real-document-text')).toContainText('즉시 회수');
  await expect(page.getByLabel('청크 선택')).toHaveValue('0');
  const original = await page.request.get(`/api/documents/${documentId}/original?download=1`);
  expect(original.status(), await original.text()).toBe(200);
  expect((await original.body()).toString()).toContain('즉시 회수');
  await page.getByRole('button', { name: '정보 수정' }).click();
  await page.getByLabel('문서 이름').fill('보안 정책.txt');
  await page.getByRole('button', { name: '변경 저장' }).click();
  await expect(page.getByRole('heading', { name: '보안 정책.txt' })).toBeVisible();
  await page.goto('/chat');
  await page.getByRole('button', { name: '문서 선택', exact: true }).click();
  await page.getByRole('checkbox', { name: '보안 정책.txt' }).check();
  await page.getByRole('button', { name: '선택 완료', exact: true }).click();
  await page.getByLabel('질문 입력').fill('보안');
  await page.getByRole('button', { name: '질문하기', exact: true }).click();
  await expect(page.getByText('AI 생성', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /\[1\] 보안 정책.txt/ })).toBeVisible();
  const conversationId = await page.getByLabel('저장된 대화').inputValue();
  expect(conversationId).toBeTruthy();
  await page.reload();
  await page.getByLabel('저장된 대화').selectOption(conversationId);
  await expect(page.getByText('AI 생성', { exact: true })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('보안', { exact: true })).toBeVisible();
  await page.goto('/documents');
  await page.getByRole('button', { name: '보안 정책.txt 삭제' }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByRole('heading', { name: '아직 등록한 문서가 없습니다' })).toBeVisible();
  expect((await page.request.get(`/api/documents/${documentId}/original`)).status()).toBe(404);
});
test('another account cannot read original files, reindex documents, or see conversations', async ({
  page,
  browser,
}) => {
  await account(page);
  await upload(page);
  const { documents } = await (await page.request.get('/api/documents')).json();
  const id = documents[0].id;
  const context = await browser.newContext();
  const other = await context.newPage();
  await account(other);
  for (const suffix of ['', '/original'])
    expect((await other.request.get(`/api/documents/${id}${suffix}`)).status()).toBe(404);
  expect((await other.request.delete(`/api/documents/${id}`)).status()).toBe(404);
  expect((await other.request.post(`/api/documents/${id}/process`, { data: {} })).status()).toBe(
    404,
  );
  expect((await (await other.request.get('/api/conversations')).json()).conversations).toEqual([]);
  await context.close();
});
test('unsupported and malformed uploads report failures without fabricated ready documents', async ({
  page,
}) => {
  await account(page);
  await page.goto('/documents');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('bad'),
  });
  await expect(page.getByRole('status')).toContainText('지원하지 않는 파일 형식');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: 'broken.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a pdf'),
  });
  await expect(page.getByText('⊗ 분석 실패', { exact: true })).toBeVisible();
  await expect(
    page.getByText('올바른 PDF 파일이 아닙니다.', { exact: false }).first(),
  ).toBeVisible();
});
test('signup creates a local account immediately and validates password confirmation', async ({
  page,
}) => {
  await page.goto('/signup');
  await page.getByLabel('이름 및 직책 *', { exact: true }).fill('새 사용자');
  await page
    .getByLabel('업무용 이메일 주소 *', { exact: true })
    .fill(`${randomUUID()}@example.com`);
  await page.getByLabel('소속 기업 / 기관명 *', { exact: true }).fill('테스트 기업');
  await page.getByPlaceholder('8자 이상', { exact: true }).fill(password);
  await page.getByPlaceholder('비밀번호 재입력').fill('Mismatch123!');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await expect(page.locator('.error-box')).toContainText('비밀번호가 일치하지 않습니다');
  await page.getByPlaceholder('비밀번호 재입력').fill(password);
  await page.getByRole('checkbox', { name: '약관 전체 동의하기' }).check();
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByLabel('기업 도메인 *', { exact: true }).fill('example.com');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByRole('checkbox', { name: '계정 및 문서 저장 안내를 확인했습니다.' }).check();
  await page.getByRole('button', { name: '계정 만들기' }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: '먼저 문서를 업로드하세요' })).toBeVisible();
});
test('password change uses current credentials and the new password can log in', async ({
  page,
}) => {
  const user = await account(page);
  await page.goto('/reset-password');
  await page.getByLabel('현재 비밀번호', { exact: true }).fill(password);
  await page.getByLabel('새 비밀번호', { exact: true }).fill('NewPassword123!');
  await page.getByLabel('비밀번호 확인', { exact: true }).fill('NewPassword123!');
  await page.getByRole('button', { name: '비밀번호 변경', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('비밀번호를 변경했습니다.');
  await page.request.post('/api/auth/logout');
  expect(
    (
      await page.request.post('/api/auth/login', { data: { email: user.email, password } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post('/api/auth/login', {
        data: { email: user.email, password: 'NewPassword123!' },
      })
    ).status(),
  ).toBe(200);
});
test('workspace pages fit desktop and mobile viewports', async ({ page, isMobile }) => {
  await account(page);
  for (const route of ['/chat', '/documents', '/admin', '/settings', '/documents/not-found']) {
    await page.goto(route);
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

test('files above 4.5 MB upload directly to private Blob while app requests stay small', async ({
  page,
}) => {
  await account(page);
  const bodySizes: number[] = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).origin === 'http://127.0.0.1:3199' &&
      new URL(request.url()).pathname.startsWith('/api/')
    )
      bodySizes.push(request.postDataBuffer()?.length || 0);
  });
  const content = '대용량 문서 보안 지침입니다.';
  const bytes = Buffer.concat([Buffer.from(content), Buffer.alloc(5 * 1024 * 1024, 32)]);
  await page.goto('/documents');
  await page
    .getByLabel('문서 파일 선택')
    .setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: bytes });
  await expect(page.getByText('● 인덱싱 완료됨')).toBeVisible({ timeout: 30000 });
  const documents = await (await page.request.get('/api/documents')).json();
  expect(documents.documents[0].size_bytes).toBe(bytes.length);
  const original = await page.request.get(`/api/documents/${documents.documents[0].id}/original`);
  expect(original.status()).toBe(200);
  expect((await original.body()).length).toBe(bytes.length);
  expect(Math.max(...bodySizes)).toBeLessThan(16384);
});

test('upload tokens reject another document owner and a substituted Blob path', async ({
  page,
}) => {
  await account(page);
  const prepared = await (
    await page.request.post('/api/documents', { data: { name: 'token.txt', size: 20 } })
  ).json();
  const tokenRequest = (pathname: string) => ({
    type: 'blob.generate-client-token',
    payload: { pathname, clientPayload: JSON.stringify({ documentId: prepared.id }) },
  });
  const wrong = await page.request.post('/api/blob/upload', {
    data: tokenRequest(prepared.pathname + '-other'),
  });
  expect(wrong.status()).toBe(400);
  await page.request.post('/api/auth/logout');
  await account(page);
  expect(
    (
      await page.request.post('/api/blob/upload', { data: tokenRequest(prepared.pathname) })
    ).status(),
  ).toBe(404);
});

test('Google SSO setup status and callback feedback are clear without credentials', async ({
  page,
}) => {
  await page.goto('/login?sso_error=account_exists');
  await expect(page.getByRole('button', { name: 'Google 계정으로 로그인' })).toBeDisabled();
  await expect(
    page.getByText(
      '이미 등록된 이메일입니다. 이메일·비밀번호로 로그인한 뒤 설정에서 Google 계정을 연결하세요.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Google 로그인는 관리자 설정 후 사용할 수 있습니다.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/signup');
  await expect(page.getByRole('button', { name: 'Google로 시작하기' })).toBeDisabled();
  await account(page);
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Google 로그인' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google 계정 연결', exact: true })).toBeDisabled();
});
