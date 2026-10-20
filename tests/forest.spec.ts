import { test, expect, type Page } from '@playwright/test';
async function parent(page: Page) {
  await page.getByRole('button', { name: '부모님', exact: true }).click();
  const label = await page.locator('.forest-modal label').innerText();
  const n = label.match(/(\d+)\s*\+\s*(\d+)/)!;
  await page.getByLabel('부모 확인 답').fill(String(Number(n[1]) + Number(n[2])));
  await page.getByRole('button', { name: '부모님 숲 열기' }).click();
}
test('forest: real learning, story, quiz, saved character and zero API requests', async ({
  page,
}) => {
  const apis: string[] = [];
  page.on('request', (r) => {
    if (
      r.url().includes('/api/') ||
      r.url().includes('generativelanguage') ||
      r.url().includes('openai')
    )
      apis.push(r.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /어떤 단어랑/ })).toBeVisible();
  await page.screenshot({
    path: `/workspace/work/forest-home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel('단어 찾기').fill('없는단어');
  await page.getByRole('button', { name: '찾기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('아직 준비 중');
  await page.getByLabel('단어 찾기').fill('사과');
  await page.getByRole('button', { name: '찾기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '사과', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '도전', exact: true }).click();
  await expect(
    page.getByText('토끼가 나무 아래에서 빨간 사과를 찾았어요.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '동화 읽으러 가기' }).click();
  await expect(page.getByRole('heading', { name: '숲속의 빨간 사과' })).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '다음 쪽 읽기' }).click();
  await expect(page.getByText('4 / 4쪽')).toBeVisible();
  await page.getByRole('button', { name: '이야기 퀴즈 풀기' }).click();
  await page.locator('.forest-choice').filter({ hasText: '바나나' }).click();
  await expect(page.getByRole('status')).toContainText('다시 생각');
  await expect(page.getByRole('button', { name: '다음 문제', exact: true })).toBeDisabled();
  await page.locator('.forest-choice').filter({ hasText: '사과' }).click();
  await page.getByRole('button', { name: '다음 문제', exact: true }).click();
  await page.locator('.forest-choice').filter({ hasText: '사과' }).click();
  await page.getByRole('button', { name: '다음 문제', exact: true }).click();
  await page.locator('.forest-choice').filter({ hasText: '깨끗이 씻었어요.' }).click();
  await page.getByRole('button', { name: '학습 결과 보기' }).click();
  await expect(page.getByRole('heading', { name: '새싹아, 끝까지 해냈구나!' })).toBeVisible();
  await expect(page.locator('.forest-leaves')).toContainText('10개');
  await page.getByRole('button', { name: '친구 꾸미기', exact: true }).click();
  await page.getByRole('button', { name: '🐻 곰', exact: true }).click();
  await page.getByLabel('친구 이름').fill('민우');
  await page.getByRole('button', { name: '이 모습으로 저장' }).click();
  await expect(page.getByRole('status')).toContainText('저장했어요');
  await page.reload();
  await expect(page.getByRole('heading', { name: /안녕 민우야/ })).toBeVisible();
  await expect(page.locator('.forest-leaves')).toContainText('10개');
  await parent(page);
  await expect(page.getByRole('heading', { name: '부모님 숲' })).toBeVisible();
  await expect(page.locator('.forest-records')).toContainText('복습 추천');
  expect(apis).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('forest: exam hides feedback, no duplicate rewards, local reset and missing voice', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {},
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '사과 단어 배우러 가기' }).click();
  await page.getByRole('button', { name: '단어 듣기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('한국어 읽기 목소리');
  await page.getByRole('button', { name: '안내 닫기' }).click();
  for (let run = 0; run < 2; run++) {
    await page.getByRole('button', { name: '놀이퀴즈', exact: true }).click();
    await page.getByRole('button', { name: '복습 · 마지막에 확인' }).click();
    for (let i = 0; i < 3; i++) {
      await page.locator('.forest-choice').first().click();
      await expect(page.locator('.forest-feedback')).toHaveCount(0);
      await page
        .getByRole('button', { name: i === 2 ? '학습 결과 보기' : '다음 문제', exact: true })
        .click();
    }
    await expect(page.locator('.forest-leaves')).toContainText('10개');
  }
  await parent(page);
  await page.getByRole('button', { name: '프로필과 기록 삭제' }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.getByRole('heading', { name: '부모님 숲' })).toBeVisible();
  await page.getByRole('button', { name: '프로필과 기록 삭제' }).click();
  await page.getByRole('button', { name: '모두 삭제', exact: true }).click();
  await expect(page.locator('.forest-leaves')).toContainText('0개');
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('0개');
});
