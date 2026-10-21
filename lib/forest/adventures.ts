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
  spooky?: boolean;
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
  {
    id: 'window-visitor',
    title: '똑똑! 창문 밖의 손님',
    englishTitle: 'Tap, Tap! A Visitor at the Window',
    description: '살짝 오싹 · 창문을 두드리는 소리! 토리와 엄마가 작은 손님의 비밀을 찾아요.',
    badge: '살펴보는 마음',
    spooky: true,
    color: '#e5e0f3',
    pages: [
      page(
        'Tori the rabbit is reading with Mom. Tap, tap!',
        '토끼 토리는 엄마와 책을 읽고 있어요. 똑, 똑!',
        'night',
        ['🐰', '🐻'],
        '📖',
        'rabbit',
        '엄마 곁에서 책을 읽던 토리가 낯선 소리에 귀를 기울여요.',
      ),
      page(
        'Something moves outside the window. It has two pointy ears!',
        '창문 밖에서 무언가 움직여요. 뾰족한 귀가 두 개나 있어요!',
        'night',
        ['🐰'],
        '👀',
        'window',
        '달빛 아래 창문 너머에 뾰족한 귀 그림자가 보여요.',
      ),
      page(
        'Tori hugs a teddy bear. “Mom, what is that?”',
        '토리는 곰 인형을 꼭 안아요. “엄마, 저게 뭐예요?”',
        'night',
        ['🐰', '🐻'],
        '🧸',
        'teddy-bear',
        '토리가 곰 인형을 안고 엄마에게 물어요.',
      ),
      page(
        '“Stay with me,” says Mom. They look through the window.',
        '“엄마랑 같이 있자.” 엄마가 말해요. 둘은 창문 너머를 살펴봐요.',
        'night',
        ['🐰', '🐻'],
        '🔦',
        'window',
        '엄마와 토리가 함께 불빛을 비춰 창밖을 살펴봐요.',
      ),
      page(
        '“Meow!” A little cat is on the step. Tap goes its tail!',
        '“야옹!” 계단 위에 작은 고양이가 있어요. 꼬리가 톡톡 닿는 소리였어요!',
        'night',
        ['🐰', '🐱'],
        '🐾',
        'cat',
        '귀 그림자의 주인은 작은 고양이였어요.',
      ),
      page(
        'Mom brings a bowl of water. The visitor takes a drink.',
        '엄마가 물 한 그릇을 가져와요. 작은 손님이 물을 마셔요.',
        'night',
        ['🐻', '🐱'],
        '🥣',
        'bowl',
        '엄마가 고양이에게 물을 주어요.',
      ),
      page(
        '“There you are!” Sam the dog arrives with his dad.',
        '“여기 있었구나!” 강아지 샘이 아빠와 함께 와요.',
        'night',
        ['🐶', '🐻', '🐱'],
        '🏡',
        'dog',
        '고양이를 찾던 샘과 아빠가 찾아왔어요.',
      ),
      page(
        'The cat goes home with Sam. “Good night, little visitor!”',
        '고양이는 샘과 집에 가요. “잘 자, 작은 손님아!”',
        'night',
        ['🐰', '🐱', '🐶'],
        '🌙',
        'cat',
        '토리가 집으로 돌아가는 고양이에게 웃으며 인사해요.',
      ),
    ],
  },
  {
    id: 'playground-shadow',
    title: '놀이터의 하얀 그림자',
    englishTitle: 'The White Shadow at the Playground',
    description: '살짝 오싹 · 미끄럼틀 뒤에서 하얀 그림자가 춤춰요. 친구들과 정체를 알아봐요.',
    badge: '함께하는 용기',
    spooky: true,
    color: '#dfE8ed',
    pages: [
      page(
        'Mimi the cat is at the playground with her dad and Sam.',
        '고양이 미미는 아빠, 샘과 놀이터에 있어요.',
        'night',
        ['🐱', '🐻', '🐶'],
        '🛝',
        'playground',
        '해가 저문 놀이터에서 아빠와 친구들이 집에 갈 준비를 해요.',
      ),
      page(
        'The swing creaks. Squeak, squeak! Nobody is on it.',
        '그네가 삐걱거려요. 끼익, 끼익! 아무도 타고 있지 않아요.',
        'night',
        ['🐱', '🐶'],
        '🌬️',
        'swing',
        '바람에 빈 그네가 흔들려 삐걱 소리가 나요.',
      ),
      page(
        'A white shape floats behind the slide. “Is that a ghost?”',
        '미끄럼틀 뒤로 하얀 것이 둥실 떠요. “유령인가?”',
        'night',
        ['🐱', '🐶'],
        '👻',
        'slide',
        '미끄럼틀 너머에서 하얀 그림자가 움직여요.',
      ),
      page(
        'Sam the dog takes Dad’s hand. “Let’s look together.”',
        '강아지 샘이 아빠 손을 잡아요. “같이 살펴봐요.”',
        'night',
        ['🐶', '🐻', '🐱'],
        '🔦',
        'dog',
        '샘과 미미가 아빠 곁에서 불빛을 따라가요.',
      ),
      page(
        'The white kite flutters in a low branch. It has a funny face!',
        '낮은 나뭇가지에서 하얀 연이 펄럭여요. 우스운 얼굴이 그려져 있어요!',
        'night',
        ['🐱', '🐶'],
        '🪁',
        'kite',
        '유령처럼 보이던 것은 얼굴이 그려진 하얀 연이었어요.',
      ),
      page(
        'A little rabbit runs over. “That’s my kite!”',
        '작은 토끼가 달려와요. “내 연이야!”',
        'night',
        ['🐰', '🐱', '🐶'],
        '🪁',
        'rabbit',
        '토리가 친구들 곁으로 와서 자기 연을 발견해요.',
      ),
      page(
        'Dad frees the kite. The friends give a happy cheer.',
        '아빠가 연을 꺼내 줘요. 친구들이 기쁘게 환호해요.',
        'night',
        ['🐻', '🐰', '🐱'],
        '🪁',
        'kite',
        '아빠가 낮은 가지에서 연을 꺼내 토리에게 건네줘요.',
      ),
      page(
        '“Good night, playground!” They all walk home together.',
        '“잘 자, 놀이터야!” 모두 함께 집으로 걸어가요.',
        'night',
        ['🐰', '🐱', '🐶'],
        '🏡',
        'playground',
        '친구들이 어른과 함께 손을 흔들며 안전하게 집으로 가요.',
      ),
    ],
  },
  {
    id: 'midnight-train',
    title: '밤 기차의 꼬마 유령',
    englishTitle: 'The Little Ghost on the Night Train',
    description:
      '살짝 오싹 · 빈 의자에서 들리는 목소리. 부끄럼 많은 꼬마 유령에게 무슨 일이 생겼을까요?',
    badge: '친구가 되는 마음',
    spooky: true,
    color: '#e7dff3',
    pages: [
      page(
        'The night train rolls along. Tori sits beside Mom.',
        '밤 기차가 달려요. 토리는 엄마 옆에 앉아 있어요.',
        'night',
        ['🐰', '🐻'],
        '🚂',
        'train',
        '달빛 아래 달리는 기차에서 토리가 엄마 곁에 앉아 있어요.',
      ),
      page(
        '“Whooo!” says a voice from an empty chair. Tori sits very still.',
        '빈 의자에서 “우우!” 소리가 나요. 토리는 가만히 몸을 굳혀요.',
        'night',
        ['🐰'],
        '🪑',
        'chair',
        '아무도 없는 것 같은 의자에서 작은 목소리가 들려요.',
      ),
      page(
        'A tiny ghost peeks out by the window. “Boo!”',
        '창문 옆에서 꼬마 유령이 빼꼼 나와요. “우!”',
        'night',
        ['🐰', '👻'],
        '🪟',
        'window',
        '둥글고 작은 유령이 창문 옆에서 조심스럽게 고개를 내밀어요.',
      ),
      page(
        'Tori the rabbit holds Mom’s hand. “Are you friendly?”',
        '토끼 토리가 엄마 손을 잡아요. “너는 착한 유령이니?”',
        'night',
        ['🐰', '🐻', '👻'],
        '🤝',
        'rabbit',
        '토리가 엄마 손을 잡고 꼬마 유령에게 말을 걸어요.',
      ),
      page(
        '“Yes! I lost my teddy bear,” whispers the ghost.',
        '“응! 내 곰 인형을 잃어버렸어.” 유령이 속삭여요.',
        'night',
        ['👻', '🐰'],
        '🧸',
        'teddy-bear',
        '꼬마 유령이 인형을 찾지 못해 속상한 마음을 이야기해요.',
      ),
      page(
        'Mom looks under the chair. Two fuzzy ears stick out!',
        '엄마가 의자 아래를 봐요. 보송보송한 귀 두 개가 삐죽 나와 있어요!',
        'night',
        ['🐻', '🐰'],
        '🧸',
        'chair',
        '엄마가 의자 아래에서 곰 인형을 발견해요.',
      ),
      page(
        '“My teddy bear!” The ghost gives it a big hug.',
        '“내 곰 인형이다!” 유령이 인형을 꼭 안아요.',
        'night',
        ['👻', '🐰'],
        '🧸',
        'teddy-bear',
        '인형을 되찾은 꼬마 유령이 기쁘게 웃어요.',
      ),
      page(
        '“Good night, new friend!” Tori waves from the train. “Boo-bye!”',
        '“잘 자, 새 친구야!” 토리가 기차에서 손을 흔들어요. “우우, 안녕!”',
        'night',
        ['🐰', '🐻', '👻'],
        '🌙',
        'train',
        '꼬마 유령과 토리가 웃으며 작별 인사를 나눠요.',
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
