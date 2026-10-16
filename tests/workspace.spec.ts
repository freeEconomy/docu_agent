import { expect, test } from '@playwright/test';
test('chat sends mock answer, opens source, and starts a new conversation', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/chat');
  if (isMobile) await expect(page.getByRole('button', { name: '근거 패널 닫기' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'DocuMind Intelligence' })).toBeVisible();
  await page.getByLabel('질문 입력').fill('3분기 예산은 얼마인가요?');
  await page.getByRole('button', { name: '질문하기' }).click();
  await expect(
    page.getByText('“3분기 예산은 얼마인가요?”에 대한 데모 답변입니다.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('link', { name: '출처: 2024_경영계획서_Q3.pdf', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '2024_경영계획서_Q3.pdf', exact: true }),
  ).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: '청크 분석', exact: true }).click();
  await expect(page.getByText('Chunk #42', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty(
    'scrollWidth',
    await page.evaluate(() => window.innerWidth),
  );
  await page.goto('/chat?new=1');
  if (isMobile) await expect(page.getByRole('button', { name: '근거 패널 닫기' })).toBeHidden();
  await expect(page.getByRole('heading', { name: '사내 지식에서 답을 찾아보세요' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('upload, processing, search, preview, persistence, metadata edit, and deletion', async ({
  page,
  isMobile,
}) => {
  await page.goto('/documents');
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: '테스트_회의록.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('프로젝트 알파의 예산은 500만 원입니다. 11월 출시 예정입니다.'),
  });
  await page.getByLabel('문서 검색', { exact: true }).fill('테스트_회의록');
  const row = page.getByRole('row').filter({ hasText: '테스트_회의록.txt' });
  await expect(row.getByText('인덱싱 완료됨', { exact: false })).toBeVisible();
  await row.getByRole('link', { name: '상세보기' }).click();
  await expect(
    page.getByRole('heading', { name: '테스트_회의록.txt', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel('원본 미리보기')
      .getByText('프로젝트 알파의 예산은 500만 원입니다.', { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '테스트_회의록.txt', exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole('button', { name: '메타데이터 편집' }).click();
  await page.getByLabel('문서명', { exact: true }).fill('수정된_회의록.txt');
  await page.getByRole('button', { name: '변경 저장' }).click();
  await expect(
    page.getByRole('heading', { name: '수정된_회의록.txt', exact: true, level: 1 }),
  ).toBeVisible();
  await page.goto('/documents');
  await page.getByLabel('문서 검색', { exact: true }).fill('수정된_회의록');
  await page.getByRole('checkbox', { name: '수정된_회의록.txt 선택', exact: true }).check();
  await page.getByRole('button', { name: '선택 삭제', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByRole('heading', { name: '검색 결과가 없습니다' })).toBeVisible();
  await page.getByLabel('문서 파일 선택').setInputFiles({
    name: 'blocked.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('no'),
  });
  await expect(page.getByRole('status')).toContainText('지원하지 않는 파일 형식');
});
test('document filtering, pagination and unknown document state', async ({ page }) => {
  await page.goto('/documents');
  await page.getByRole('button', { name: 'Markdown/TXT', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: '정보보안_가이드라인.md' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: '2024_경영계획서_Q3.pdf' })).toHaveCount(0);
  await page.locator('.tabs').getByRole('button', { name: /^전체/ }).click();
  await page.getByLabel('인덱싱 상태 필터').selectOption('failed');
  await expect(
    page.getByRole('row').filter({ hasText: '구형_스캔문서_암호화본.pdf' }),
  ).toBeVisible();
  await page.getByLabel('인덱싱 상태 필터').selectOption('all');
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: '정보보안_가이드라인.md' })).toBeVisible();
  await page.goto('/documents/missing');
  await expect(page.getByRole('heading', { name: '문서를 찾을 수 없습니다' })).toBeVisible();
});
test('mock email login and dashboard interactions', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '업무용 계정 로그인', exact: true }).click();
  await page.getByLabel('업무용 이메일 주소', { exact: true }).fill('demo@company.test');
  await page.locator('input[name=password]').fill('Demo1234!');
  await page.getByRole('button', { name: '비밀번호 표시', exact: true }).click();
  await expect(page.locator('input[name=password]')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: '워크스페이스 로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/chat/);
  await page.goto('/admin');
  await page.getByLabel('통계 기간').selectOption('7');
  await expect(page.locator('.stat-value').filter({ hasText: '3,332' })).toBeVisible();
  await page.getByLabel('감사 로그 필터').selectOption('failed');
  await expect(page.getByText('업로드 차단 / 실패', { exact: true })).toBeVisible();
  await expect(page.getByText('품질 검증 통과', { exact: true })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '리포트 내보내기' }).click();
  expect((await download).suggestedFilename()).toBe('DocuMind-운영리포트.csv');
  await page.getByRole('button', { name: '스케줄 관리' }).click();
  await page.getByLabel('매주 일요일 실행 시각 (KST)').fill('03:00');
  await page.getByRole('button', { name: '설정 적용' }).click();
  await expect(page.getByText('매주 일요일 03:00 KST', { exact: false })).toBeVisible();
});
test('signup validates password confirmation and completes demo flow', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('이름 및 직책 *', { exact: true }).fill('데모 연구원');
  await page.getByLabel('업무용 이메일 주소 *', { exact: true }).fill('demo@company.test');
  await page.getByLabel('비밀번호 설정 *', { exact: true }).fill('Demo1234!');
  await page.getByLabel('비밀번호 확인 *', { exact: true }).fill('Different!');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await expect(page.locator('p[role=alert]')).toContainText('일치하지 않습니다');
  await page.getByLabel('비밀번호 확인 *', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByLabel('소속 기업 / 기관명 *', { exact: true }).fill('미래전략연구소');
  await page.getByLabel('기업 도메인 *', { exact: true }).fill('company.test');
  await page.getByRole('button', { name: '다음 단계' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '데모 워크스페이스 시작하기' }).click();
  await expect(page).toHaveURL(/\/chat/);
});
test('main routes fit viewport and mobile navigation works', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const route of [
    '/chat',
    '/documents',
    '/documents/DOC-8942',
    '/admin',
    '/login',
    '/signup',
    '/settings',
  ]) {
    await page.goto(route);
    await page.locator('h1').waitFor();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      route,
    ).toBe(true);
  }
  if (isMobile) {
    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await page.getByRole('link', { name: '관리자 대시보드', exact: true }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
