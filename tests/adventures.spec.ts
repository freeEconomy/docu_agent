import { test, expect, type Page } from '@playwright/test';
import { tales } from '../lib/forest/adventures';
import { words } from '../lib/forest/content';

async function openGame(page: Page, name: string) {
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await page.getByRole('button', { name: `${name} 시작`, exact: true }).click();
}
async function matchAll(page: Page) {
  const ids = await page
    .locator('.memory-card')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('data-pair')!))]);
  for (const id of ids) {
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="photo"]`).click();
    await page.locator(`.memory-card[data-pair="${id}"][data-kind="word"]`).click();
  }
}

test('stories keep old profiles, resume bookmarks and grant only one daily reward without external calls', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.origin !== 'http://127.0.0.1:3199' || url.pathname.startsWith('/api/'))
      external.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('wordforest-english-v1')!);
    delete profile.storyPages;
    delete profile.activityRecords;
    profile.leaves = 20;
    profile.symbol = '🐱';
    localStorage.setItem('wordforest-english-v1', JSON.stringify(profile));
  });
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('20 P');
  await expect(page.locator('.run-companion-face')).toHaveText('🐱');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await expect(page.locator('.tale-cover')).toHaveCount(3);
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}`, exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await expect(page.getByText(tales[0].pages[3].english, { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('storybook-reader.png'), fullPage: true });
  await page.getByRole('button', { name: '뜻 숨기기', exact: true }).click();
  await expect(page.locator('.tale-translation')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await expect(page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` })).toContainText(
    '이어 읽기 · 4 / 8',
  );
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` }).click();
  await expect(page.getByText(tales[0].pages[3].english, { exact: true })).toBeVisible();
  for (let i = 3; i < 7; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await page.getByRole('button', { name: '이야기 완료', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('+10 P');
  await expect(page.locator('.forest-leaves')).toContainText('30 P');
  await page.getByRole('button', { name: '처음부터 다시 읽기', exact: true }).click();
  for (let i = 0; i < 7; i++)
    await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  await page.getByRole('button', { name: '이야기 완료', exact: true }).click();
  await expect(page.getByLabel('모험 완료')).toContainText('이미 받았어요');
  await expect(page.locator('.forest-leaves')).toContainText('30 P');
  await page.getByRole('button', { name: '다른 동화 보기', exact: true }).click();
  await expect(page.locator('.tale-cover').first()).toContainText('완독');
  expect(external).toEqual([]);
});

test('memory supports a mistake, matched pairs, replay, highest score and daily reward cap', async ({
  page,
}) => {
  await page.goto('/');
  await openGame(page, '짝꿍 카드');
  const ids = await page
    .locator('.memory-card')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('data-pair')!))]);
  await page.locator(`.memory-card[data-pair="${ids[0]}"][data-kind="photo"]`).click();
  await page.locator(`.memory-card[data-pair="${ids[1]}"][data-kind="word"]`).click();
  await expect(page.locator('.game-feedback')).toContainText('다른 짝');
  await page.getByRole('button', { name: '다시 뒤집기', exact: true }).click();
  await matchAll(page);
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '한 번 더 놀기', exact: true }).click();
  await matchAll(page);
  await expect(page.getByLabel('모험 완료')).toContainText('100');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  await expect(page.getByRole('button', { name: '짝꿍 카드 시작', exact: true })).toContainText(
    '최고 기록 100점',
  );
  await page.reload();
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem('wordforest-english-v1')!).activityRecords,
  );
  expect(records).toHaveLength(1);
  expect(records[0].score).toBe(100);
});

test('listening game stays playable with text hints, wrong answers and all five treasures', async ({
  page,
}) => {
  await page.goto('/');
  await openGame(page, '소리 탐정');
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '단어 힌트 보기', exact: true }).click();
    const name = await page.locator('.sound-hint').innerText();
    const word = words.find((w) => w.name === name)!;
    if (i === 0) {
      const wrong = page
        .locator('.listening-options button')
        .filter({ hasNotText: word.korean })
        .first();
      await wrong.click();
      await expect(page.getByRole('button', { name: '다음 소리', exact: true })).toBeDisabled();
    }
    await page.getByRole('button', { name: `${word.korean} 선택`, exact: true }).click();
    await page
      .getByRole('button', { name: i === 4 ? '보물상자 열기' : '다음 소리', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
});

test('sentence train accepts keyboard play, correction and five complete sentences on small screens', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '게임', exact: true }).click();
  const start = page.getByRole('button', { name: '문장 기차 시작', exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  for (let round = 0; round < 5; round++) {
    const count = await page.locator('.sentence-tokens button').count();
    if (round === 0) {
      for (let n = count - 1; n >= 0; n--)
        await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
      await page.getByRole('button', { name: '문장 확인', exact: true }).click();
      await expect(page.locator('.game-feedback')).toContainText('순서를 조금');
      await page.getByRole('button', { name: '다시 만들기', exact: true }).click();
    }
    for (let n = 0; n < count; n++)
      await page.locator(`.sentence-tokens button[data-position="${n}"]`).click();
    await page.getByRole('button', { name: '문장 확인', exact: true }).click();
    await page
      .getByRole('button', { name: round === 4 ? '여행 마치기' : '다음 역으로', exact: true })
      .click();
  }
  await expect(page.getByLabel('모험 완료')).toContainText('90');
  await expect(page.locator('.forest-leaves')).toContainText('10 P');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '다른 게임 보기', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: test.info().outputPath('game-menu.png'), fullPage: true });
});

test('story narration and listening games use English voices and stop across scene changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      __spoken: { text: string; lang: string }[];
      __stops: number;
    };
    state.__spoken = [];
    state.__stops = 0;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
      configurable: true,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [{ lang: 'ko-KR' }, { lang: 'en-US' }],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {
          state.__stops++;
        },
        speak: (utterance: { text: string; lang: string; onstart?: () => void }) => {
          state.__spoken.push({ text: utterance.text, lang: utterance.lang });
          utterance.onstart?.();
        },
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '동화', exact: true }).click();
  await page.getByRole('button', { name: `동화 읽기: ${tales[0].title}` }).click();
  await page.getByRole('button', { name: '이 장면 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: tales[0].pages[0].english,
    lang: 'en-US',
  });
  const stops = await page.evaluate(() => (window as any).__stops);
  await page.getByRole('button', { name: '다음 장면', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__stops)).toBeGreaterThan(stops);
  await page.getByRole('button', { name: '이 장면 듣기', exact: true }).click();
  expect((await page.evaluate(() => (window as any).__spoken.at(-1))).text).toBe(
    tales[0].pages[1].english,
  );
  await openGame(page, '소리 탐정');
  await page.getByRole('button', { name: '단어 힌트 보기', exact: true }).click();
  const word = await page.locator('.sound-hint').innerText();
  await page.getByRole('button', { name: '영어 소리 듣기', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__spoken.at(-1))).toEqual({
    text: word,
    lang: 'en-US',
  });
});
