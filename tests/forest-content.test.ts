import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { words, findWord, makeQuiz, sentenceCount } from '../lib/forest/content';
import credits from '../lib/forest/photo-credits.json';

test('expanded lessons have unique searchable words, bilingual scenes and answerable quizzes', () => {
  assert.equal(words.length, 40);
  assert.equal(new Set(words.map((word) => word.id)).size, words.length);
  assert.equal(sentenceCount, 240);
  for (const category of ['스포츠', '놀이', '놀이터', '음식', '동물']) {
    assert.equal(words.filter((word) => word.category === category).length, 6, category);
  }
  for (const word of words) {
    assert.equal(findWord(word.name)?.id, word.id, word.name);
    assert.equal(findWord(word.korean)?.id, word.id, word.korean);
    assert.equal(word.sentences.length, 3);
    assert.equal(word.alternate.length, 3);
    assert.equal(word.translations.length, 3);
    assert.equal(word.alternateTranslations.length, 3);
    assert.equal(word.story.pages.length, 6);
    assert.equal(word.story.translations.length, 6);
    assert.ok(
      [...word.sentences, ...word.alternate, ...word.story.pages].every(
        (text) => text.trim().length > 0,
      ),
    );
    const quiz = makeQuiz(word);
    assert.equal(quiz.length, 5);
    assert.ok(quiz[1].sentence?.includes('____'), word.id);
    for (const question of quiz) {
      assert.equal(new Set(question.options).size, 3, `${word.id}: ${question.question}`);
      assert.equal(question.options.filter((option) => option === question.answer).length, 1);
      assert.ok(question.hint && question.explanation);
    }
  }
  // Exact vocabulary wins over an earlier lesson's related-word alias.
  assert.equal(findWord('spoon')?.id, 'bowl');
  assert.equal(findWord('  TEDDY   BEAR ')?.id, 'teddy-bear');
  assert.equal(findWord('football')?.id, 'soccer');
});

test('all lesson photographs have attribution and unchanged local JPEG bytes', () => {
  for (const word of words) {
    const credit = credits.find((item) => item.id === word.photoId);
    assert.ok(credit, word.id);
    assert.equal(credit.local, word.photo);
    assert.equal(credit.license, 'CC0-1.0');
    assert.ok(credit.author && credit.source && credit.licenseUrl);
    const bytes = readFileSync(`public${credit.local}`);
    assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff', word.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), credit.localSha256, word.id);
  }
});

import {
  tales,
  gameModes,
  trainRounds,
  gameWordIds,
  readAdventure,
  recordActivity,
  emptyAdventure,
} from '../lib/forest/adventures';

test('three original bilingual tales connect every scene to real vocabulary', () => {
  assert.equal(tales.length, 3);
  assert.equal(new Set(tales.map((t) => t.id)).size, 3);
  for (const tale of tales) {
    assert.equal(tale.pages.length, 8);
    for (const page of tale.pages) {
      const word = words.find((w) => w.id === page.wordId);
      assert.ok(word);
      assert.ok(page.english.toLowerCase().includes(word.name), `${tale.id}: ${page.english}`);
      assert.ok(page.korean && page.caption && page.cast.length && page.prop);
    }
  }
  assert.equal(gameModes.length, 3);
  assert.ok(gameWordIds.every((id) => words.some((w) => w.id === id)));
  assert.equal(trainRounds.length, 5);
  for (const round of trainRounds) {
    assert.ok(words.some((w) => w.id === round.wordId));
    assert.ok(round.korean);
    assert.ok(round.english.split(' ').length <= 5);
  }
});

test('adventure migration preserves valid bookmarks and daily rewards cannot be farmed', () => {
  assert.deepEqual(readAdventure({ name: '기존 프로필' }), emptyAdventure);
  assert.deepEqual(
    readAdventure({
      storyPages: { 'rainbow-ball': 3, 'cloud-train': 99 },
      activityRecords: [{ activityId: 'unknown', date: 'bad', score: 500 }],
    }),
    { storyPages: { 'rainbow-ball': 3 }, activityRecords: [] },
  );
  const first = recordActivity(emptyAdventure, 'game:memory', 80, '2026-10-21T14:59:00Z');
  assert.equal(first.pointsEarned, 10);
  let progress = first.progress;
  for (let i = 0; i < 400; i++) {
    const repeat = recordActivity(progress, 'game:memory', 100, '2026-10-21T14:59:30Z');
    assert.equal(repeat.pointsEarned, 0);
    progress = repeat.progress;
  }
  assert.equal(progress.activityRecords.length, 1);
  assert.equal(progress.activityRecords[0].score, 100);
  assert.equal(
    recordActivity(progress, 'game:memory', 50, '2026-10-21T15:00:00Z').pointsEarned,
    10,
  );
  assert.equal(
    recordActivity(progress, 'story:rainbow-ball', 100, '2026-10-21T14:59:30Z').pointsEarned,
    10,
  );
  assert.throws(() => recordActivity(progress, 'story:missing', 100));
  assert.throws(() => recordActivity(progress, 'game:train', 101));
});
