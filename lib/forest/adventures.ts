export type SceneTheme = 'meadow' | 'pond' | 'bakery' | 'clouds' | 'night';
export type TalePage = {
  english: string;
  korean: string;
  theme: SceneTheme;
  cast: string[];
  prop: string;
  wordId: string;
  caption: string;
};
export type Tale = {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  badge: string;
  color: string;
  pages: TalePage[];
};
const page = (
  english: string,
  korean: string,
  theme: SceneTheme,
  cast: string[],
  prop: string,
  wordId: string,
  caption: string,
): TalePage => ({ english, korean, theme, cast, prop, wordId, caption });
export const tales: Tale[] = [
  {
    id: 'rainbow-ball',
    title: '토리와 무지개 공',
    englishTitle: 'The Rainbow Ball',
    description: '잃어버린 공을 찾다 보니, 함께 노는 기쁨도 찾았어요.',
    badge: '함께하는 마음',
    color: '#e6f0d7',
    pages: [
      page(
        'Tori has a red ball. “Let’s play!”',
        '토리에게 빨간 공이 있어요. “같이 놀자!”',
        'meadow',
        ['🐰'],
        '⚽',
        'ball',
        '토끼 토리가 풀밭에서 공과 함께 서 있어요.',
      ),
      page(
        'Sam the dog runs over. “Can I play with you?”',
        '강아지 샘이 달려와요. “나도 같이 놀아도 될까?”',
        'meadow',
        ['🐰', '🐶'],
        '⚽',
        'dog',
        '토리에게 강아지 샘이 찾아왔어요.',
      ),
      page(
        'The ball rolls past the slide. “Oh, no!”',
        '공이 미끄럼틀을 지나 굴러가요. “어떡하지!”',
        'meadow',
        ['🐰', '🐶'],
        '🛝',
        'slide',
        '친구들이 미끄럼틀 옆으로 굴러간 공을 찾아요.',
      ),
      page(
        'Mimi the cat sees it near the pond. “Over here!”',
        '고양이 미미가 연못 근처에서 공을 봐요. “여기야!”',
        'pond',
        ['🐱', '🐰'],
        '⚽',
        'cat',
        '고양이 미미가 연못 쪽을 가리켜요.',
      ),
      page(
        'Three ducks swim by. “Let’s stay on the path.”',
        '오리 세 마리가 헤엄쳐 가요. “우리는 길 위에 있자.”',
        'pond',
        ['🐰', '🐶', '🐱'],
        '🦆',
        'duck',
        '친구들은 물가에서 떨어져 오리들을 바라봐요.',
      ),
      page(
        'Sam spots the ball behind a tree. “I found it!”',
        '샘이 나무 뒤에서 공을 발견해요. “찾았다!”',
        'meadow',
        ['🐶', '🐱'],
        '⚽',
        'ball',
        '샘이 나무 아래에 있던 공을 찾았어요.',
      ),
      page(
        '“Can you pass me the ball?” “Here you go!”',
        '“공을 나에게 건네줄래?” “여기 있어!”',
        'meadow',
        ['🐶', '🐰'],
        '⚽',
        'ball',
        '샘이 토리에게 공을 건네줘요.',
      ),
      page(
        'At the playground, a rainbow appears. “It’s more fun together!”',
        '놀이터에 무지개가 떠올라요. “함께 놀면 더 재미있어!”',
        'meadow',
        ['🐰', '🐶', '🐱'],
        '🌈',
        'playground',
        '무지개 아래에서 세 친구가 함께 놀아요.',
      ),
    ],
  },
  {
    id: 'little-bakery',
    title: '미미의 반짝반짝 빵집',
    englishTitle: 'The Little Sparkle Bakery',
    description: '빵 한 조각, 사과 한 조각. 나누면 마음이 반짝여요.',
    badge: '나누는 마음',
    color: '#fbe5ce',
    pages: [
      page(
        'Mimi finds a tiny bakery. It smells like bread.',
        '미미가 작은 빵집을 발견해요. 빵 냄새가 솔솔 나요.',
        'bakery',
        ['🐱'],
        '🍞',
        'bread',
        '고양이 미미가 향긋한 빵집을 찾아왔어요.',
      ),
      page(
        '“May I have some bread?” she asks.',
        '“빵을 조금 먹어도 될까요?” 미미가 물어요.',
        'bakery',
        ['🐱', '🐻'],
        '🍞',
        'bread',
        '미미가 곰 아저씨에게 빵을 부탁해요.',
      ),
      page(
        'Bear brings a bowl of water. “Let’s wash our hands.”',
        '곰 아저씨가 물그릇을 가져와요. “우리 손부터 씻자.”',
        'bakery',
        ['🐻', '🐱'],
        '🧼',
        'bowl',
        '곰 아저씨와 미미가 손을 깨끗이 씻어요.',
      ),
      page(
        'Mimi sits on a chair. Bear opens the oven.',
        '미미가 의자에 앉아요. 곰 아저씨가 오븐을 열어요.',
        'bakery',
        ['🐻', '🐱'],
        '🥖',
        'chair',
        '곰 아저씨가 빵을 준비하고 미미는 기다려요.',
      ),
      page(
        '“One, two, three!” They count the warm bread rolls.',
        '“하나, 둘, 셋!” 따뜻한 빵을 함께 세어요.',
        'bakery',
        ['🐻', '🐱'],
        '🥐',
        'bread',
        '따뜻한 빵들이 준비되었어요.',
      ),
      page(
        '“I have an apple,” says Tori. “We can share!”',
        '“나에게는 사과가 있어.” 토리가 말해요. “나눠 먹자!”',
        'bakery',
        ['🐰', '🐱'],
        '🍎',
        'apple',
        '토리가 빨간 사과를 가져왔어요.',
      ),
      page(
        '“Would you like a piece?” Everyone shares the apple.',
        '“한 조각 먹을래?” 모두 사과를 나눠 먹어요.',
        'bakery',
        ['🐻', '🐰', '🐱'],
        '🍞',
        'apple',
        '친구들이 빵과 사과를 나눠 먹어요.',
      ),
      page(
        'Bread crumbs sparkle like stars. “Thank you, friends!”',
        '빵 부스러기가 별처럼 반짝여요. “친구들아, 고마워!”',
        'bakery',
        ['🐰', '🐱', '🐻'],
        '✨',
        'bread',
        '함께 나누니 작은 빵집에 별빛이 가득해요.',
      ),
    ],
  },
  {
    id: 'cloud-train',
    title: '별님을 데려다주는 구름 기차',
    englishTitle: 'The Star and the Cloud Train',
    description: '집을 잃은 작은 별과 친구들이 떠나는 포근한 밤 여행.',
    badge: '도와주는 마음',
    color: '#e9e4f8',
    pages: [
      page(
        'Sam the dog meets a little star. “I can’t find my home.”',
        '강아지 샘이 작은 별을 만나요. “내 집을 찾을 수 없어.”',
        'night',
        ['🐶'],
        '⭐',
        'dog',
        '길을 잃은 작은 별을 샘이 만났어요.',
      ),
      page(
        '“We can help,” says Tori. A cloud train arrives.',
        '“우리가 도와줄게.” 토리가 말해요. 구름 기차가 도착해요.',
        'clouds',
        ['🐰', '🐶'],
        '🚂',
        'train',
        '토리와 샘 앞에 구름 기차가 나타났어요.',
      ),
      page(
        '“All aboard!” The friends get on the train.',
        '“모두 타세요!” 친구들이 기차에 올라요.',
        'clouds',
        ['🐰', '🐶', '🐱'],
        '🚂',
        'train',
        '친구들이 작은 별과 함께 기차를 타요.',
      ),
      page(
        'They ride past a giant kite. “Look up!”',
        '커다란 연을 지나가요. “위를 봐!”',
        'clouds',
        ['🐰', '🐱'],
        '🪁',
        'kite',
        '구름 사이로 커다란 연이 날고 있어요.',
      ),
      page(
        'The sky grows dark. Mimi the cat holds the star’s hand.',
        '하늘이 어두워져요. 고양이 미미가 별님의 손을 잡아 줘요.',
        'night',
        ['🐱'],
        '⭐',
        'cat',
        '미미가 작은 별의 곁에 있어 줘요.',
      ),
      page(
        '“I see the moon!” calls Sam. The train slows down.',
        '“달님이 보여!” 샘이 외쳐요. 기차가 천천히 멈춰요.',
        'night',
        ['🐶', '🐰'],
        '🚂',
        'train',
        '친구들이 달님을 발견하고 기차를 멈춰요.',
      ),
      page(
        'At the window, the moon waves. “Welcome home, little star!”',
        '창가에서 달님이 손을 흔들어요. “집에 온 걸 환영해, 작은 별아!”',
        'night',
        ['🐱', '🐰'],
        '⭐',
        'window',
        '달님과 작은 별이 다시 만났어요.',
      ),
      page(
        '“Thank you for helping me!” The friends wave from the train.',
        '“도와줘서 고마워!” 친구들이 기차에서 손을 흔들어 인사해요.',
        'night',
        ['🐶', '🐰', '🐱'],
        '🌙',
        'train',
        '친구들이 별님과 달님에게 다정하게 인사해요.',
      ),
    ],
  },
];
export const gameModes = [
  {
    id: 'memory',
    title: '짝꿍 카드',
    subtitle: '사진과 영어의 짝을 찾아요',
    emoji: '🃏',
    tag: '기억력 + 단어',
    color: '#e0edda',
  },
  {
    id: 'listen',
    title: '소리 탐정',
    subtitle: '영어 소리를 듣고 보물을 찾아요',
    emoji: '🔎',
    tag: '듣기 + 단어',
    color: '#e2edf8',
  },
  {
    id: 'train',
    title: '문장 기차',
    subtitle: '낱말을 연결하면 문장이 출발!',
    emoji: '🚂',
    tag: '문장 + 순서',
    color: '#fbe5d2',
  },
] as const;
export type GameId = (typeof gameModes)[number]['id'];
export type ActivityId = `story:${string}` | `game:${GameId}`;
export type ActivityRecord = { activityId: ActivityId; date: string; score: number };
export type AdventureProgress = {
  storyPages: Record<string, number>;
  activityRecords: ActivityRecord[];
};
export const emptyAdventure: AdventureProgress = { storyPages: {}, activityRecords: [] };
const activityIds = new Set([
  ...tales.map((t) => `story:${t.id}`),
  ...gameModes.map((g) => `game:${g.id}`),
]);
export function readAdventure(raw: unknown): AdventureProgress {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdventureProgress>;
  const storyPages: Record<string, number> = {};
  for (const tale of tales) {
    const n = value.storyPages?.[tale.id];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < tale.pages.length)
      storyPages[tale.id] = n;
  }
  const activityRecords = Array.isArray(value.activityRecords)
    ? value.activityRecords
        .filter(
          (r) =>
            r &&
            activityIds.has(r.activityId) &&
            Number.isFinite(Date.parse(r.date)) &&
            Number.isInteger(r.score) &&
            r.score >= 0 &&
            r.score <= 100,
        )
        .slice(-180)
    : [];
  return { storyPages, activityRecords };
}
const day = (date: string) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
export function recordActivity(
  progress: AdventureProgress,
  activityId: ActivityId,
  score: number,
  date = new Date().toISOString(),
) {
  if (
    !activityIds.has(activityId) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    !Number.isFinite(Date.parse(date))
  )
    throw new Error('Invalid activity result');
  const index = progress.activityRecords.findIndex(
    (r) => r.activityId === activityId && day(r.date) === day(date),
  );
  const records = [...progress.activityRecords];
  const previous = records[index];
  const record = { activityId, date, score: Math.max(previous?.score ?? 0, score) };
  if (index < 0) records.push(record);
  else records[index] = record;
  return {
    progress: { ...progress, activityRecords: records.slice(-180) },
    pointsEarned: index < 0 ? 10 : 0,
  };
}
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export const gameWordIds = [
  'dog',
  'cat',
  'rabbit',
  'duck',
  'apple',
  'banana',
  'bread',
  'milk',
  'ball',
  'bicycle',
  'bus',
  'train',
];
export const trainRounds = [
  { wordId: 'dog', english: 'I see a dog.', korean: '강아지가 보여요.' },
  { wordId: 'ball', english: 'This is a ball.', korean: '이것은 공이에요.' },
  { wordId: 'apple', english: 'I like apples.', korean: '나는 사과를 좋아해요.' },
  { wordId: 'playground', english: 'Let’s play together.', korean: '우리 함께 놀자.' },
  { wordId: 'milk', english: 'Can I have milk?', korean: '우유를 마셔도 될까요?' },
];
