import { test, expect, type Page } from '@playwright/test';
import { words, makeQuiz } from '../lib/forest/content';
const quiz = makeQuiz(words[0]);
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
  await page.getByRole('button', { name: '도전 읽기', exact: true }).click();
  await expect(page.getByText(words[0].sentences[2], { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다른 문장' }).click();
  await expect(page.getByText(words[0].alternate[2], { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '동화 읽으러 가기' }).click();
  await expect(page.getByRole('heading', { name: words[0].story.title })).toBeVisible();
  for (let i = 0; i < words[0].story.pages.length - 1; i++)
    await page.getByRole('button', { name: '다음 쪽 읽기' }).click();
  await expect(page.getByText('6 / 6쪽')).toBeVisible();
  await page.getByRole('button', { name: '이야기 퀴즈 풀기' }).click();
  await page
    .locator('.forest-choice')
    .filter({ hasText: quiz[0].options.find((o) => o !== quiz[0].answer)! })
    .click();
  await expect(page.getByRole('status')).toContainText('다시 생각');
  await expect(page.getByRole('button', { name: '다음 문제', exact: true })).toBeDisabled();
  for (let i = 0; i < quiz.length; i++) {
    await page.locator('.forest-choice').filter({ hasText: quiz[i].answer }).click();
    await expect(page.getByRole('status')).toContainText(quiz[i].explanation);
    await page
      .getByRole('button', {
        name: i === quiz.length - 1 ? '학습 결과 보기' : '다음 문제',
        exact: true,
      })
      .click();
  }
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
    for (let i = 0; i < quiz.length; i++) {
      await page.locator('.forest-choice').first().click();
      await expect(page.locator('.forest-feedback')).toHaveCount(0);
      await page
        .getByRole('button', {
          name: i === quiz.length - 1 ? '학습 결과 보기' : '다음 문제',
          exact: true,
        })
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
test('forest: expanded vocabulary, six-page resume and legacy three-question records survive', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('wordforest-v1'))
      localStorage.setItem(
        'wordforest-v1',
        JSON.stringify({
          name: '민우',
          animal: 'rabbit',
          color: '#b9dca8',
          hat: '없음',
          level: 1,
          rate: 0.85,
          goal: 10,
          leaves: 10,
          records: [{ word: 'apple', date: '2026-10-19T12:00:00Z', firstTry: 2, review: true }],
          learned: ['apple'],
          selected: 'apple',
          storyPage: 3,
        }),
      );
  });
  await page.goto('/');
  await expect(page.locator('.forest-leaves')).toContainText('10개');
  await parent(page);
  await expect(page.locator('.forest-records')).toContainText('2/3');
  await page.getByRole('button', { name: '아이 화면으로' }).click();
  await page.getByLabel('단어 찾기').fill('증발');
  await page.getByRole('button', { name: '찾기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '해', exact: true })).toBeVisible();
  await expect(page.locator('.forest-glossary>button.selected')).toContainText('증발');
  await page.getByRole('button', { name: '동화 읽으러 가기' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: '다음 쪽 읽기' }).click();
  await expect(page.locator('.forest-thinking')).toContainText('아직 모르는 점');
  await page.reload();
  await page.getByRole('button', { name: '동화마을', exact: true }).click();
  await expect(page.getByText('6 / 6쪽')).toBeVisible();
  await page.getByRole('button', { name: '이야기 퀴즈 풀기' }).click();
  const questions = makeQuiz(words.find((w) => w.id === 'sun')!);
  for (let i = 0; i < questions.length; i++) {
    await page.locator('.forest-choice').filter({ hasText: questions[i].answer }).click();
    await page
      .getByRole('button', {
        name: i === questions.length - 1 ? '학습 결과 보기' : '다음 문제',
        exact: true,
      })
      .click();
  }
  await parent(page);
  await expect(page.locator('.forest-records')).toContainText('5/5');
  await expect(page.locator('.forest-records')).toContainText('2/3');
});
